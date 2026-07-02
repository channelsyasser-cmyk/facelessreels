"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function TopBar({ title, email }: { title: string; email?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-surface-border flex items-center justify-between px-8 sticky top-0 bg-ink-900/80 backdrop-blur z-10">
      <h1 className="font-display font-semibold text-lg tracking-tightest">{title}</h1>
      <div className="flex items-center gap-4">
        {email && <span className="text-sm text-ink2">{email}</span>}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-ink2 hover:text-white transition"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </header>
  );
}
