"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, CalendarDays, Dumbbell, History, LayoutDashboard, Library, Settings, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useApp } from "@/features/auth/app-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/start", label: "Start Workout", icon: Dumbbell },
  { href: "/routines", label: "Routines", icon: CalendarDays },
  { href: "/exercises", label: "Exercise Library", icon: Library },
  { href: "/history", label: "Exercise History", icon: History },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authMode, isDemoMode } = useApp();

  if (authMode === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-accent" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,255,95,0.08),transparent_30%),#08090b]">
      <div className="mx-auto grid min-h-screen max-w-7xl md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-border/80 p-4 md:block">
          <div className="mb-8 flex items-center gap-3 px-2 pt-2">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">IronLog</p>
              <p className="text-xs text-muted">{isDemoMode ? "Demo workspace" : "Training workspace"}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-foreground",
                  pathname === item.href && "bg-white/10 text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Card className="absolute bottom-4 left-4 right-4 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Timer className="size-4 text-accent" />
              Fast logging
            </div>
            <p className="text-xs leading-5 text-muted">Autosaves every set so refreshes and interruptions do not lose workouts.</p>
          </Card>
        </aside>
        <main className="min-w-0 pb-24 md:pb-0">
          <div className="px-4 py-4 sm:px-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium text-muted",
                pathname === item.href && "bg-white/10 text-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="max-w-full truncate">{item.label.replace(" Workout", "").replace("Exercise Library", "Library").replace("Exercise History", "History")}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
