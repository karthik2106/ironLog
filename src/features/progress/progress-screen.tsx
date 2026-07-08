"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/features/auth/app-provider";
import { estimatedOneRepMax, setVolume } from "@/lib/workout/engine";
import { formatShortDate } from "@/lib/utils";

export function ProgressScreen() {
  const { store } = useApp();
  const completed = store.sessions.filter((session) => session.status === "completed");
  const weekly = Array.from({ length: 8 }).map((_, index) => {
    const start = new Date();
    start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const sessions = completed.filter((session) => new Date(session.startedAt) >= start && new Date(session.startedAt) < end);
    return {
      week: formatShortDate(start),
      workouts: sessions.length,
      sets: sessions.flatMap((session) => session.exercises).flatMap((exercise) => exercise.sets).filter((set) => set.completedAt).length,
      volume: Math.round(sessions.flatMap((session) => session.exercises).flatMap((exercise) => exercise.sets).reduce((sum, set) => sum + setVolume(set), 0)),
    };
  });
  const muscleSets = Object.entries(
    completed
      .flatMap((session) => session.exercises)
      .reduce<Record<string, number>>((acc, exercise) => {
        acc[exercise.primaryMuscleSnapshot] = (acc[exercise.primaryMuscleSnapshot] ?? 0) + exercise.sets.filter((set) => set.completedAt).length;
        return acc;
      }, {}),
  ).map(([muscle, sets]) => ({ muscle, sets }));
  const strength = completed
    .slice()
    .reverse()
    .map((session) => ({
      date: formatShortDate(session.startedAt),
      strength: Math.max(0, ...session.exercises.flatMap((exercise) => exercise.sets.map((set) => estimatedOneRepMax(set.weight ?? 0, set.reps ?? 0)))),
    }));
  const avgDuration = completed.length ? Math.round(completed.reduce((sum, session) => sum + (session.durationSeconds ?? 0), 0) / completed.length / 60) : 0;
  const frequency = completed.length;

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header>
          <p className="text-sm text-muted">Progress</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Training analytics</h1>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          <Stat label="Completed workouts" value={frequency.toString()} />
          <Stat label="Average duration" value={`${avgDuration}m`} />
          <Stat label="Personal records" value={store.personalRecords.length.toString()} />
          <Stat label="Consistency" value={`${Math.min(100, weekly.filter((item) => item.workouts > 0).length * 13)}%`} />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Workout frequency by week" data={weekly} dataKey="workouts" />
          <ChartCard title="Training volume by week" data={weekly} dataKey="volume" />
          <ChartCard title="Total sets by muscle group" data={muscleSets} dataKey="sets" nameKey="muscle" />
          <Card>
            <CardHeader>
              <CardTitle>Strength progression</CardTitle>
              <CardDescription>Best estimated 1RM per completed workout.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strength}>
                  <CartesianGrid stroke="#272a31" vertical={false} />
                  <XAxis dataKey="date" stroke="#a7adb8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#a7adb8" width={30} />
                  <Tooltip contentStyle={{ background: "#111317", border: "1px solid #272a31", borderRadius: 16 }} />
                  <Line dataKey="strength" stroke="#d7ff5f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Personal records</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {store.personalRecords.slice(0, 8).map((record) => (
                <div key={record.id} className="flex justify-between rounded-2xl bg-white/5 p-3">
                  <div><p className="font-medium">{record.exerciseNameSnapshot}</p><p className="text-sm text-muted">{record.type}</p></div>
                  <Badge>{record.value} {record.unit}</Badge>
                </div>
              ))}
              {store.personalRecords.length === 0 && <p className="text-sm text-muted">Records appear after completed sets.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Most trained exercises</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(completed.flatMap((session) => session.exercises).reduce<Record<string, number>>((acc, exercise) => {
                acc[exercise.exerciseNameSnapshot] = (acc[exercise.exerciseNameSnapshot] ?? 0) + 1;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => (
                <div key={name} className="flex justify-between rounded-2xl bg-white/5 p-3"><span>{name}</span><Badge>{count}</Badge></div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted">{label}</p><p className="numeric-input mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>;
}

function ChartCard({ title, data, dataKey, nameKey = "week" }: { title: string; data: object[]; dataKey: string; nameKey?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#272a31" vertical={false} />
            <XAxis dataKey={nameKey} stroke="#a7adb8" tickLine={false} axisLine={false} />
            <YAxis stroke="#a7adb8" width={30} />
            <Tooltip contentStyle={{ background: "#111317", border: "1px solid #272a31", borderRadius: 16 }} />
            <Bar dataKey={dataKey} fill="#d7ff5f" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
