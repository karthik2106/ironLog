"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/features/auth/app-provider";
import { estimatedOneRepMax, setVolume } from "@/lib/workout/engine";
import { formatShortDate } from "@/lib/utils";

const ranges = [
  ["4w", 28],
  ["3m", 92],
  ["6m", 184],
  ["1y", 365],
  ["All", Infinity],
] as const;

export function HistoryScreen() {
  const { store } = useApp();
  const [exerciseId, setExerciseId] = useState(store.exercises[0]?.id ?? "");
  const [rangeDays, setRangeDays] = useState<number>(92);
  const [nowMs] = useState(() => Date.now());
  const exercise = store.exercises.find((item) => item.id === exerciseId);
  const entries = useMemo(() => {
    const cutoff = rangeDays === Infinity ? new Date(0) : new Date(nowMs - rangeDays * 86400000);
    return store.sessions
      .filter((session) => session.status === "completed" && new Date(session.startedAt) >= cutoff)
      .flatMap((session) =>
        session.exercises
          .filter((item) => item.exerciseId === exerciseId)
          .map((item) => ({ session, exercise: item })),
      );
  }, [store.sessions, exerciseId, rangeDays, nowMs]);
  const sets = entries.flatMap((entry) => entry.exercise.sets.filter((set) => set.completedAt));
  const latest = sets[0];
  const bestWeight = Math.max(0, ...sets.map((set) => set.weight ?? 0));
  const bestReps = Math.max(0, ...sets.map((set) => set.reps ?? 0));
  const totalVolume = sets.reduce((sum, set) => sum + setVolume(set), 0);
  const chartData = entries
    .slice()
    .reverse()
    .map((entry) => {
      const bestSet = entry.exercise.sets.reduce((best, set) => (estimatedOneRepMax(set.weight ?? 0, set.reps ?? 0) > estimatedOneRepMax(best.weight ?? 0, best.reps ?? 0) ? set : best), entry.exercise.sets[0]);
      return {
        date: formatShortDate(entry.session.startedAt),
        weight: bestSet?.weight ?? 0,
        reps: bestSet?.reps ?? 0,
        oneRm: estimatedOneRepMax(bestSet?.weight ?? 0, bestSet?.reps ?? 0),
      };
    });
  const calendarDays = buildCalendar(store);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header>
          <p className="text-sm text-muted">Exercise History</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Strength by exercise</h1>
        </header>
        <Card>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto]">
            <select className="min-h-12 rounded-2xl border border-border bg-black/25 px-3" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
              {store.exercises.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="flex gap-2 overflow-auto">
              {ranges.map(([label, days]) => (
                <Button key={label} size="sm" variant={rangeDays === days ? "default" : "secondary"} onClick={() => setRangeDays(days)}>
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Latest" value={latest ? `${latest.weight} ${store.settings.unit} x ${latest.reps}` : "None"} />
          <Metric label="Best weight" value={`${bestWeight} ${store.settings.unit}`} />
          <Metric label="Best reps" value={bestReps.toString()} />
          <Metric label="Best e1RM" value={`${Math.max(0, ...sets.map((set) => estimatedOneRepMax(set.weight ?? 0, set.reps ?? 0)))} ${store.settings.unit}`} />
          <Metric label="Total sets" value={sets.length.toString()} />
          <Metric label="Volume" value={`${Math.round(totalVolume)} ${store.settings.unit}`} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{exercise?.name ?? "Exercise"} progression</CardTitle>
            <CardDescription>Weight, reps, and estimated 1RM use completed sets only.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#a7adb8" tickLine={false} axisLine={false} />
                <YAxis stroke="#a7adb8" tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#111317", border: "1px solid #272a31", borderRadius: 16 }} />
                <Line type="monotone" dataKey="weight" stroke="#d7ff5f" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="oneRm" stroke="#ffffff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="reps" stroke="#8b93a5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workout calendar</CardTitle>
            <CardDescription>Completed days, scheduled sessions, missed sessions, and rest days for this month.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <button
                key={day.iso}
                className={`min-h-20 rounded-2xl border p-2 text-left ${
                  day.completed ? "border-accent bg-accent/10" : day.missed ? "border-red-400/40 bg-red-500/10" : day.scheduled ? "border-border bg-white/5" : "border-border bg-black/20"
                }`}
                onClick={() => day.session && alert(`${day.session.routineNameSnapshot}\n${day.session.exercises.length} exercises`)}
              >
                <p className="text-xs text-muted">{day.date.getDate()}</p>
                <p className="mt-2 text-xs font-medium">{day.completed ? day.session?.routineNameSnapshot : day.missed ? "Missed" : day.scheduled ? day.routineName : "Rest"}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.exercise.id} className="rounded-2xl bg-white/5 p-3">
                <div className="mb-2 flex justify-between">
                  <p className="font-medium">{entry.session.routineNameSnapshot}</p>
                  <Badge>{formatShortDate(entry.session.startedAt)}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {entry.exercise.sets.filter((set) => set.completedAt).map((set) => `${set.weight}${entry.session.unit} x ${set.reps}`).join(" · ") || "No completed sets"}
                </p>
              </div>
            ))}
            {entries.length === 0 && <p className="text-sm text-muted">No entries yet for this exercise.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function buildCalendar(store: ReturnType<typeof useApp>["store"]) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days = [];
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const current = new Date(date);
    const iso = localDateKey(current);
    const session = store.sessions.find((item) => item.status === "completed" && localDateKey(new Date(item.startedAt)) === iso);
    const routine = store.routines.find((item) => !item.archivedAt && item.scheduledDays.includes(current.getDay()));
    days.push({
      date: current,
      iso,
      session,
      completed: Boolean(session),
      scheduled: Boolean(routine),
      routineName: routine?.name,
      missed: Boolean(routine && !session && current < today),
    });
  }
  return days;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted">{label}</p>
        <p className="numeric-input mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
