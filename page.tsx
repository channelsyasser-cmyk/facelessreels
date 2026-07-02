import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const stages = ["Niche", "Script", "Voice", "Visuals", "Render", "Publish"];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-display font-semibold text-lg tracking-tightest">
          <span className="w-2 h-2 rounded-full bg-ember" />
          Reelforge
        </div>
        <nav className="flex items-center gap-6 text-sm text-ink2">
          <Link href="/login" className="hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-full bg-ember text-ink-900 font-medium hover:bg-ember-soft transition"
          >
            Start free
          </Link>
        </nav>
      </header>

      <section className="flex-1 max-w-6xl mx-auto w-full px-8 pt-16 pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ember mb-6 border border-ember-dim rounded-full px-3 py-1">
            <Sparkles size={12} /> One niche in, one channel on autopilot
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tightest font-semibold mb-6">
            Feed it a niche.
            <br />
            It ships a video every day.
          </h1>
          <p className="text-ink2 text-lg leading-relaxed mb-10 max-w-xl">
            Reelforge writes the script, voices it, generates the visuals, cuts the video
            with burned-in subtitles, and publishes it to YouTube, Instagram, and TikTok —
            on a schedule you set once.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ember text-ink-900 font-medium hover:bg-ember-soft transition"
            >
              Start free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="text-ink2 hover:text-white transition text-sm">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mt-20 rounded-xl2 border border-surface-border bg-surface p-8">
          <p className="text-xs uppercase tracking-widest text-ink2 mb-6">
            What runs automatically, every day
          </p>
          <div className="stage-track">
            {stages.map((label, i) => (
              <div key={label} className={`stage-node ${i === 0 ? "done" : i === 1 ? "active" : ""}`}>
                <div className="stage-dot">{i + 1}</div>
                <span className="text-sm text-ink2 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
