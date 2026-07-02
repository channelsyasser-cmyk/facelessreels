"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Film,
  CalendarClock,
  Plug,
  CreditCard,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create", icon: Wand2 },
  { href: "/dashboard/videos", label: "Videos", icon: Film },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/dashboard/connections", label: "Connections", icon: Plug },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-surface-border bg-surface flex flex-col py-6 px-3 h-screen sticky top-0">
      <Link href="/" className="flex items-center gap-2 px-3 mb-8 font-display font-semibold tracking-tightest">
        <span className="w-2 h-2 rounded-full bg-ember" />
        Reelforge
      </Link>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-ink-800 text-white"
                  : "text-ink2 hover:text-white hover:bg-ink-800/60"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-6 border-t border-surface-border">
        <p className="text-xs text-ink2 leading-relaxed">
          Videos publish automatically once scheduled — no need to keep this tab open.
        </p>
      </div>
    </aside>
  );
}
