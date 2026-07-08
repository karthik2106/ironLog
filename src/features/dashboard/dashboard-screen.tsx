"use client";

import Link from "next/link";
import { ArrowUpRight, Dumbbell, Play, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/features/auth/app-provider";
import { formatDate, formatDuration, formatShortDate } from "@/lib/utils";
import { estimatedOneRepMax, summarizeWorkout } from "@/lib/workout/engine";

export function DashboardScreen() {
  const { store } = useApp();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const active = store.sessions.find((session) => session.status === "active");
  const completed = store.sessions.filter((session) => session.status === "completed");
  const completedSets = completed.flatMap((session) => session.exercises).flatMap((exercise) => exercise.sets).filter((set) => set.completedAt).length;
  const lastWorkout = completed[0];
  const chartData = completed
    .slice(0, 8)
    .reverse()
    .map((session) => {
      const best = Math.max(
        0,
        ...session.exercises.flatMap((exercise) => exercise.sets.map((set) => estimatedOneRepMax(set.weight ?? 0, set.reps ?? 0))),
      );
      return { date: formatShortDate(session.startedAt), strength: best || 1 };
    });

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted">{formatDate(new Date())}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Ready, {store.profile.displayName}</h1>
          </div>
          <Button asChild size="lg">
            <Link href="/start">
              <Play className="size-5" />
              Start Workout
            </Link>
          </Button>
        </header>

        {active && (
          <Card className="border-accent/40 bg-accent/10">
            <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge className="border-accent/30 bg-accent/10 text-accent">In progress</Badge>
                <h2 className="mt-3 text-xl font-semibold">{active.routineNameSnapshot}</h2>
                <p className="text-sm text-muted">{formatDuration((nowMs - new Date(active.startedAt).getTime()) / 1000)} elapsed</p>
              </div>
              <Button asChild>
                <Link href="/start">
                  Resume Workout
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Total workouts" value={completed.length.toString()} subtitle="Completed sessions" icon={<Dumbbell className="size-5 text-accent" />} />
          <Metric title="Working sets" value={completedSets.toString()} subtitle="All completed sets" />
          <Metric title="Recent PRs" value={store.personalRecords.slice(0, 7).length.toString()} subtitle="Best lifts captured" icon={<Trophy className="size-5 text-accent" />} />
          <Metric title="Available routines" value={store.routines.filter((routine) => !routine.archivedAt).length.toString()} subtitle="Push A, Pull A, Legs, Push B, Pull B" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Last completed</CardTitle>
              <CardDescription>{lastWorkout ? formatShortDate(lastWorkout.startedAt) : "Your first session will appear here."}</CardDescription>
            </CardHeader>
            <CardContent>
              {lastWorkout ? (
                <div className="space-y-3">
                  <p className="text-2xl font-semibold">{lastWorkout.routineNameSnapshot}</p>
                  <p className="text-sm text-muted">
                    {summarizeWorkout(store, lastWorkout).completedSets} sets · {formatDuration(lastWorkout.durationSeconds ?? 0)}
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">Start with Push A, Pull A, Legs, Push B, or Pull B. IronLog will build your history from completed sets.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strength trend</CardTitle>
              <CardDescription>Best estimated 1RM per completed workout.</CardDescription>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length ? chartData : [{ date: "Start", strength: 1 }]}>
                  <XAxis dataKey="date" stroke="#a7adb8" tickLine={false} axisLine={false} />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Tooltip contentStyle={{ background: "#111317", border: "1px solid #272a31", borderRadius: 16 }} />
                  <Area type="monotone" dataKey="strength" stroke="#d7ff5f" fill="#d7ff5f22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent personal records</CardTitle>
              <CardDescription>New bests detected automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {store.personalRecords.slice(0, 4).map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-medium">{record.exerciseNameSnapshot}</p>
                    <p className="text-xs text-muted">{record.type.replace("_", " ")}</p>
                  </div>
                  <p className="text-lg font-semibold text-accent">{record.value}</p>
                </div>
              ))}
              {store.personalRecords.length === 0 && <p className="text-sm leading-6 text-muted">Complete hard sets to populate this list.</p>}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted">{title}</p>
          {icon}
        </div>
        <p className="numeric-input text-4xl font-semibold">{value}</p>
        <p className="mt-2 text-xs text-muted">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
