/**
 * TikTok Content Posting API integration.
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 *
 * IMPORTANT: direct, unaudited posting is restricted. New apps default to
 * posting as "private" (visible only to the connecting account) until
 * TikTok's App Review approves the app for public posting. Build and test
 * assuming that constraint - don't promise users public auto-posting until
 * your app has actually been approved.
 */

const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export function getTikTokAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    state,
  });
  return `${TIKTOK_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string, redirectUri: string) {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    open_id: string;
  }>;
}

/**
 * Publishes a video by handing TikTok a direct-fetch URL (must be a public
 * HTTPS URL that TikTok's servers can pull from, e.g. Supabase Storage).
 */
export async function publishTikTokVideo(params: {
  accessToken: string;
  videoUrl: string;
  caption: string;
}): Promise<{ publishId: string }> {
  const res = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: params.caption.slice(0, 150),
        privacy_level: "SELF_ONLY", // flip to PUBLIC_TO_EVERYONE once app review approves it
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: params.videoUrl,
      },
    }),
  });

  if (!res.ok) throw new Error(`TikTok publish init failed: ${await res.text()}`);
  const data = await res.json();
  return { publishId: data.data.publish_id };
}

/** Polls TikTok for the async publish status of a previously-submitted video. */
export async function getTikTokPublishStatus(accessToken: string, publishId: string) {
  const res = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  if (!res.ok) throw new Error(`TikTok status check failed: ${await res.text()}`);
  const data = await res.json();
  return data.data.status as string; // e.g. "PROCESSING_UPLOAD" | "PUBLISH_COMPLETE" | "FAILED"
}
