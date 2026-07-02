import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateVoiceover } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, script, user_id")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
  if (!video.script) {
    return NextResponse.json({ error: "Video has no script yet" }, { status: 400 });
  }

  try {
    const audioBuffer = await generateVoiceover({ text: video.script });

    const path = `${user.id}/${videoId}/voiceover.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, audioBuffer, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("media").getPublicUrl(path);

    await supabase
      .from("videos")
      .update({ voiceover_url: publicUrl.publicUrl, status: "voice_ready" })
      .eq("id", videoId);

    return NextResponse.json({ voiceoverUrl: publicUrl.publicUrl });
  } catch (err) {
    console.error(err);
    await supabase
      .from("videos")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Voiceover generation failed",
      })
      .eq("id", videoId);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Voiceover generation failed" },
      { status: 500 }
    );
  }
}
