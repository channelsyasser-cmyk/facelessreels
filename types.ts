export type Platform = "youtube" | "instagram" | "tiktok";

export type VideoStatus =
  | "queued"
  | "script_ready"
  | "voice_ready"
  | "images_ready"
  | "rendering"
  | "ready"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "starter" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  timezone: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  platform_account_id: string;
  display_name: string | null;
  status: "active" | "expired" | "revoked";
  connected_at: string;
}

export interface Niche {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tone: string;
  target_length_seconds: number;
  posting_time: string;
  is_active: boolean;
}

export interface VideoRecord {
  id: string;
  user_id: string;
  niche_id: string | null;
  title: string | null;
  script: string | null;
  scenes: { narration: string; imagePrompt: string; imageUrl?: string }[] | null;
  voiceover_url: string | null;
  image_urls: string[] | null;
  subtitle_srt: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: VideoStatus;
  error_message: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  user_id: string;
  video_id: string;
  connected_account_id: string;
  scheduled_for: string;
  status: "pending" | "publishing" | "published" | "failed" | "cancelled";
  platform_post_id: string | null;
  attempts: number;
  last_error: string | null;
}

export interface AnalyticsSnapshot {
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watch_time_seconds: number;
  captured_at: string;
}
