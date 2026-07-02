const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

/**
 * Converts narration text to speech via ElevenLabs and returns raw MP3 bytes.
 * The caller is responsible for uploading the buffer to Supabase Storage.
 */
export async function generateVoiceover(params: {
  text: string;
  voiceId?: string;
}): Promise<Buffer> {
  const voiceId = params.voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID;
  if (!voiceId) throw new Error("No ElevenLabs voice ID configured");

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.8 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Lists voices available on the connected ElevenLabs account, for a voice picker UI. */
export async function listVoices() {
  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  if (!res.ok) throw new Error(`Failed to list ElevenLabs voices (${res.status})`);
  const data = await res.json();
  return data.voices as { voice_id: string; name: string }[];
}
