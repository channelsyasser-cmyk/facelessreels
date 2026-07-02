/**
 * Instagram Graph API integration (via a linked Facebook Page + Meta app).
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 *
 * Requirements the user must satisfy before this works:
 *  - Instagram account converted to a Business or Creator account
 *  - That account linked to a Facebook Page
 *  - A Meta Developer app in Live mode with instagram_content_publish approved
 *    (goes through App Review - sandbox/dev mode only works for the app's own testers)
 *
 * Publishing is a two-step process: create a media container from a
 * publicly reachable video URL, then publish that container once IG
 * finishes processing it.
 */

const GRAPH_BASE = "https://graph.facebook.com/v20.0";

export function getInstagramAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ].join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Instagram token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/** Looks up the Instagram Business Account ID connected to the user's Facebook Page. */
export async function getInstagramAccountId(pageAccessToken: string, pageId: string) {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );
  if (!res.ok) throw new Error(`Failed to resolve IG business account: ${await res.text()}`);
  const data = await res.json();
  return data.instagram_business_account?.id as string | undefined;
}

export async function publishInstagramReel(params: {
  igUserId: string;
  accessToken: string;
  videoUrl: string; // must be a public HTTPS URL (e.g. Supabase Storage public bucket)
  caption: string;
}): Promise<{ mediaId: string }> {
  // Step 1: create the media container
  const createRes = await fetch(`${GRAPH_BASE}/${params.igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: params.videoUrl,
      caption: params.caption,
      access_token: params.accessToken,
    }),
  });
  if (!createRes.ok) throw new Error(`IG container create failed: ${await createRes.text()}`);
  const { id: creationId } = await createRes.json();

  // Step 2: poll processing status
  let status = "IN_PROGRESS";
  for (let i = 0; i < 20 && status === "IN_PROGRESS"; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `${GRAPH_BASE}/${creationId}?fields=status_code&access_token=${params.accessToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.status_code;
  }
  if (status !== "FINISHED") {
    throw new Error(`IG media never finished processing (status: ${status})`);
  }

  // Step 3: publish
  const publishRes = await fetch(`${GRAPH_BASE}/${params.igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: params.accessToken }),
  });
  if (!publishRes.ok) throw new Error(`IG publish failed: ${await publishRes.text()}`);
  const published = await publishRes.json();
  return { mediaId: published.id };
}
