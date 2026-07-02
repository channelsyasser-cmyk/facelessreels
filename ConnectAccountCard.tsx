"use client";

import type { ConnectedAccount, Platform } from "@/lib/types";
import { Youtube, Instagram, Music2, CheckCircle2 } from "lucide-react";

const META: Record<Platform, { label: string; icon: typeof Youtube; color: string }> = {
  youtube: { label: "YouTube Shorts", icon: Youtube, color: "#FF3B30" },
  instagram: { label: "Instagram Reels", icon: Instagram, color: "#E1306C" },
  tiktok: { label: "TikTok", icon: Music2, color: "#25F4EE" },
};

export function ConnectAccountCard({
  platform,
  account,
}: {
  platform: Platform;
  account?: ConnectedAccount;
}) {
  const { label, icon: Icon, color } = META[platform];
  const connected = !!account && account.status === "active";

  return (
    <div className="rounded-xl2 border border-surface-border bg-surface p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-ink2">
            {connected ? account.display_name || "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      {connected ? (
        <span className="flex items-center gap-1.5 text-xs text-mint">
          <CheckCircle2 size={14} /> Active
        </span>
      ) : (
        <a
          href={`/api/oauth/${platform}`}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-ember text-ink-900 hover:bg-ember-soft transition"
        >
          Connect
        </a>
      )}
    </div>
  );
}
