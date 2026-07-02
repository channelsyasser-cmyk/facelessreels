import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ScriptScene {
  narration: string;
  imagePrompt: string;
}

export interface GeneratedScript {
  title: string;
  scenes: ScriptScene[];
}

/**
 * Generates a short-form vertical video script broken into scenes.
 * Each scene has narration (spoken by the voiceover) and an image prompt
 * (fed to the image generator) so script + visuals stay in sync.
 */
export async function generateScript(params: {
  niche: string;
  tone: string;
  targetLengthSeconds: number;
}): Promise<GeneratedScript> {
  const { niche, tone, targetLengthSeconds } = params;
  const sceneCount = Math.max(3, Math.round(targetLengthSeconds / 8));

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content:
          "You write scripts for faceless short-form vertical videos (Reels/Shorts/TikTok). " +
          "Output strict JSON only, matching this shape: " +
          '{"title": string, "scenes": [{"narration": string, "imagePrompt": string}]}. ' +
          "Narration lines are spoken aloud, so write for the ear: short sentences, a hook in " +
          "the first line, no stage directions, no emojis. Each imagePrompt describes a single " +
          "still image that visually matches its narration line, written for an AI image generator.",
      },
      {
        role: "user",
        content:
          `Niche: ${niche}\n` +
          `Tone: ${tone}\n` +
          `Target length: ~${targetLengthSeconds} seconds spoken aloud\n` +
          `Number of scenes: ${sceneCount}\n` +
          "Write a hook-driven script now.",
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty script response");

  const parsed = JSON.parse(raw) as GeneratedScript;
  if (!parsed.scenes?.length) throw new Error("Generated script had no scenes");
  return parsed;
}

/**
 * Generates one still image per scene via DALL-E 3. Returns hosted URLs
 * (temporary, ~1hr) that the render step downloads and bakes into the video.
 */
export async function generateSceneImage(prompt: string): Promise<string> {
  const result = await client.images.generate({
    model: "dall-e-3",
    prompt: `${prompt}. Vertical 9:16 composition, cinematic lighting, no text overlays, no watermarks.`,
    size: "1024x1792",
    quality: "standard",
    n: 1,
  });

  const url = result.data[0]?.url;
  if (!url) throw new Error("DALL-E returned no image URL");
  return url;
}
