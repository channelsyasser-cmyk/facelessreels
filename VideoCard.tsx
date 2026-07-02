import type { VideoRecord } from "@/lib/types";
import { PipelineStepper } from "./PipelineStepper";
import { format } from "date-fns";
import { Film } from "lucide-react";

export function VideoCard({ video }: { video: VideoRecord }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-surface p-4 flex gap-4">
      <div className="w-16 h-28 rounded-lg bg-ink-800 border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Film size={18} className="text-ink2" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-medium truncate">{video.title ?? "Untitled video"}</h3>
          <span className="text-xs text-ink2 font-mono whitespace-nowrap">
            {format(new Date(video.created_at), "MMM d, HH:mm")}
          </span>
        </div>
        <p className="text-xs text-ink2 line-clamp-2 mb-3">{video.script ?? "Script pending…"}</p>
        <PipelineStepper status={video.status} />
      </div>
    </div>
  );
}
