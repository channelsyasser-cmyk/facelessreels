/**
 * Standalone render worker. Run this as a long-lived process, separate
 * from the Next.js app - ffmpeg encoding is too slow and too heavy for a
 * serverless function's time/memory limits.
 *
 * Deploy target: a small always-on box (Railway, Render "Background
 * Worker", Fly.io, or a $5/mo VPS). It needs:
 *   - ffmpeg installed on the host (apt install ffmpeg / brew install ffmpeg)
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in its env
 *
 * Run with: npm run worker
 */

import { createClient } from "@supabase/supabase-js";
import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const POLL_INTERVAL_MS = 10_000;
const WORDS_PER_SECOND = 2.5; // ~150 wpm, used to time subtitles per scene

interface Scene {
  narration: string;
  imagePrompt: string;
  imageUrl?: string;
}

async function main() {
  console.log("Render worker started. Polling every", POLL_INTERVAL_MS, "ms");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processNextVideo();
    } catch (err) {
      console.error("Worker loop error:", err);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

async function processNextVideo() {
  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("status", "rendering")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!video) return; // nothing to do this tick

  console.log(`Rendering video ${video.id}...`);
  const workDir = path.join(os.tmpdir(), `render-${randomUUID()}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const scenes: Scene[] = video.scenes ?? [];
    if (scenes.length === 0) throw new Error("No scenes to render");

    // 1. Download voiceover + all scene images locally
    const audioPath = path.join(workDir, "voice.mp3");
    await downloadTo(video.voiceover_url, audioPath);

    const imagePaths: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const imgPath = path.join(workDir, `scene-${i}.png`);
      await downloadTo(scenes[i].imageUrl!, imgPath);
      imagePaths.push(imgPath);
    }

    // 2. Estimate per-scene duration from word count, matching total audio length
    const audioDuration = await getAudioDuration(audioPath);
    const wordCounts = scenes.map((s) => s.narration.split(/\s+/).length);
    const totalWords = wordCounts.reduce((a, b) => a + b, 0);
    const sceneDurations = wordCounts.map(
      (w) => Math.max(1.5, (w / totalWords) * audioDuration)
    );

    // 3. Build an SRT subtitle file timed against those scene durations
    const srtPath = path.join(workDir, "subs.srt");
    writeSrt(srtPath, scenes, sceneDurations);

    // 4. Build an ffmpeg concat list (each image held for its scene duration)
    const concatListPath = path.join(workDir, "images.txt");
    const concatList = imagePaths
      .map((p, i) => `file '${p}'\nduration ${sceneDurations[i].toFixed(2)}`)
      .join("\n");
    // ffmpeg's concat demuxer needs the last file repeated without a duration line
    fs.writeFileSync(
      concatListPath,
      concatList + `\nfile '${imagePaths[imagePaths.length - 1]}'\n`
    );

    // 5. Render: slideshow + audio + burned-in subtitles, vertical 1080x1920
    const outputPath = path.join(workDir, "output.mp4");
    await renderVideo({ concatListPath, audioPath, srtPath, outputPath });

    // 6. Upload the finished mp4
    const buffer = fs.readFileSync(outputPath);
    const storagePath = `${video.user_id}/${video.id}/final.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, buffer, { contentType: "video/mp4", upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("media").getPublicUrl(storagePath);

    await supabase
      .from("videos")
      .update({
        video_url: publicUrl.publicUrl,
        subtitle_srt: fs.readFileSync(srtPath, "utf-8"),
        duration_seconds: Math.round(audioDuration),
        status: "ready",
      })
      .eq("id", video.id);

    console.log(`Finished rendering video ${video.id}`);
  } catch (err) {
    console.error(`Render failed for video ${video.id}:`, err);
    await supabase
      .from("videos")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Render failed",
      })
      .eq("id", video.id);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function renderVideo(params: {
  concatListPath: string;
  audioPath: string;
  srtPath: string;
  outputPath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(params.concatListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .input(params.audioPath)
      .complexFilter([
        // Scale/pad every frame to a consistent vertical canvas, then burn subtitles.
        `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles=${params.srtPath.replace(
          /:/g,
          "\\:"
        )}[v]`,
      ])
      .outputOptions([
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
      ])
      .save(params.outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 30);
    });
  });
}

function writeSrt(filePath: string, scenes: Scene[], durations: number[]) {
  let cursor = 0;
  const blocks = scenes.map((scene, i) => {
    const start = cursor;
    const end = cursor + durations[i];
    cursor = end;
    return `${i + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${scene.narration}\n`;
  });
  fs.writeFileSync(filePath, blocks.join("\n"));
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

async function downloadTo(url: string, filePath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main();
