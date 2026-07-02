import type { VideoStatus } from "@/lib/types";

const STAGES: { key: VideoStatus; label: string }[] = [
  { key: "queued", label: "Niche" },
  { key: "script_ready", label: "Script" },
  { key: "voice_ready", label: "Voice" },
  { key: "images_ready", label: "Visuals" },
  { key: "ready", label: "Render" },
  { key: "published", label: "Publish" },
];

const ORDER: VideoStatus[] = [
  "queued",
  "script_ready",
  "voice_ready",
  "images_ready",
  "rendering",
  "ready",
  "scheduled",
  "publishing",
  "published",
];

export function PipelineStepper({ status }: { status: VideoStatus }) {
  const currentIndex = ORDER.indexOf(status);
  const stageIndexMap = [0, 1, 2, 3, 4, 4, 4, 5, 5]; // maps ORDER index -> STAGES index
  const activeStage = stageIndexMap[currentIndex] ?? 0;

  if (status === "failed") {
    return <span className="text-xs text-danger font-mono">pipeline failed</span>;
  }

  return (
    <div className="stage-track">
      {STAGES.map((stage, i) => (
        <div
          key={stage.key}
          className={`stage-node ${
            i < activeStage ? "done" : i === activeStage ? "active" : ""
          }`}
        >
          <div className="stage-dot">{i + 1}</div>
          <span className="text-xs text-ink2 whitespace-nowrap hidden md:inline">
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );
}
