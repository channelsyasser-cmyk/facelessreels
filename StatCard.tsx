import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-ink2">{label}</span>
        <Icon size={16} className="text-ember" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold tracking-tightest">{value}</span>
        {delta && <span className="text-xs text-mint font-mono">{delta}</span>}
      </div>
    </div>
  );
}
