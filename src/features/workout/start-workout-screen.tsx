"use client";

import Link from "next/link";
import { Check, Clock, Pause, Play, Plus, RotateCcw, Trash2, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApp } from "@/features/auth/app-provider";
import { formatDuration } from "@/lib/utils";
import { summarizeWorkout } from "@/lib/workout/engine";
import type { WorkoutSet } from "@/lib/workout/types";

const presets = [30, 60, 90, 120, 180];

export function StartWorkoutScreen() {
  const app = useApp();
  const { store } = app;
  const [activeSessionId, setActiveSessionId] = useState<string | null>(store.sessions.find((session) => session.status === "active")?.id ?? null);
  const activeSession = store.sessions.find((session) => session.id === activeSessionId && session.status === "active");

  function start(routineId: string) {
    const session = app.startWorkout(routineId);
    setActiveSessionId(session?.id ?? null);
  }

  return (
    <AppShell>
      {activeSession ? <LiveWorkout sessionId={activeSession.id} /> : <RoutinePicker onStart={start} />}
    </AppShell>
  );
}

function RoutinePicker({ onStart }: { onStart: (routineId: string) => void }) {
  const { store } = useApp();
  const active = store.sessions.find((session) => session.status === "active");
  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <p className="text-sm text-muted">Start Workout</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Choose today&apos;s session</h1>
      </header>
      {active && (
        <Card className="border-accent/40 bg-accent/10">
          <CardContent className="flex items-center justify-between gap-4 pt-5">
            <div>
              <p className="font-semibold">Resume {active.routineNameSnapshot}</p>
              <p className="text-sm text-muted">Autosaved from {new Date(active.startedAt).toLocaleTimeString()}</p>
            </div>
            <Button onClick={() => onStart(active.routineId ?? "")}>Resume</Button>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {store.routines
          .filter((routine) => !routine.archivedAt)
          .map((routine) => (
            <Card key={routine.id}>
              <CardHeader>
                <CardTitle>{routine.name}</CardTitle>
                <CardDescription>
                  {routine.exercises.filter((exercise) => !exercise.archivedAt).length} exercises ·{" "}
                  {routine.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0)} target sets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {routine.exercises
                    .filter((exercise) => !exercise.archivedAt)
                    .slice(0, 5)
                    .map((exercise) => (
                      <div key={exercise.id} className="flex justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
                        <span>{exercise.exerciseNameSnapshot}</span>
                        <span className="text-muted">
                          {exercise.targetSets} x {exercise.minReps}-{exercise.maxReps}
                        </span>
                      </div>
                    ))}
                </div>
                <Button className="w-full" onClick={() => onStart(routine.id)}>
                  <Play className="size-4" />
                  Start {routine.name}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function LiveWorkout({ sessionId }: { sessionId: string }) {
  const app = useApp();
  const { store } = app;
  const session = store.sessions.find((item) => item.id === sessionId);
  const [elapsed, setElapsed] = useState(0);
  const [restSeconds, setRestSeconds] = useState(store.settings.defaultRestSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(4);
  const [finishOpen, setFinishOpen] = useState(false);
  const nextInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => setElapsed((Date.now() - new Date(session.startedAt).getTime()) / 1000), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          if (store.settings.vibrationEnabled && "vibrate" in navigator) navigator.vibrate(180);
          toast.success("Rest complete");
          return store.settings.defaultRestSeconds;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, store.settings.defaultRestSeconds, store.settings.vibrationEnabled]);

  const summary = useMemo(() => (session ? summarizeWorkout(store, session) : null), [session, store]);

  if (!session || !summary) {
    return (
      <div className="space-y-4">
        <p className="text-muted">No active workout found.</p>
        <Button asChild>
          <Link href="/start">Pick a routine</Link>
        </Button>
      </div>
    );
  }

  function complete(set: WorkoutSet) {
    if (!session) return;
    if (!set.weight || !set.reps) {
      toast.error("Enter weight and reps first");
      return;
    }
    app.completeSet(session.id, set.id);
    if (store.settings.autoStartRestTimer) {
      setRestSeconds(store.settings.defaultRestSeconds);
      setTimerRunning(true);
    }
    window.setTimeout(() => nextInputRef.current?.focus(), 30);
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Live workout</p>
            <h1 className="text-2xl font-semibold">{session.routineNameSnapshot}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge>
              <Clock className="mr-1 size-3" />
              {formatDuration(elapsed)}
            </Badge>
            <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
              <DialogTrigger asChild>
                <Button>Finish Workout</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finish workout</DialogTitle>
                  <DialogDescription>Review the session, add optional notes, then save it to history.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <SummaryCell label="Duration" value={formatDuration(summary.durationSeconds)} />
                  <SummaryCell label="Sets" value={summary.completedSets.toString()} />
                  <SummaryCell label="Reps" value={summary.totalReps.toString()} />
                  <SummaryCell label="Volume" value={`${summary.totalVolume} ${session.unit}`} />
                </div>
                {summary.personalRecords.length > 0 && <p className="text-sm text-accent">{summary.personalRecords.length} new personal records</p>}
                <div className="space-y-2">
                  <Label htmlFor="notes">Workout notes</Label>
                  <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Session rating</Label>
                  <Input id="rating" type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    app.finishActiveWorkout(session.id, notes, rating);
                    setFinishOpen(false);
                  }}
                >
                  Save completed workout
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Card className="border-accent/25">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Rest timer</p>
            <p className="numeric-input text-4xl font-semibold">{formatDuration(restSeconds)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((seconds) => (
              <Button key={seconds} size="sm" variant="secondary" onClick={() => setRestSeconds(seconds)}>
                {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setTimerRunning((current) => !current)}>
              {timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              {timerRunning ? "Pause" : "Start"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRestSeconds((current) => current + 30)}>
              +30s
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRestSeconds(store.settings.defaultRestSeconds)}>
              <RotateCcw className="size-4" />
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {session.exercises
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{exercise.exerciseNameSnapshot}</CardTitle>
                    <CardDescription>
                      Target {exercise.sets[0]?.targetMinReps}-{exercise.sets[0]?.targetMaxReps} reps · RIR {exercise.targetRir ?? "optional"}
                    </CardDescription>
                  </div>
                  <Badge>{exercise.primaryMuscleSnapshot}</Badge>
                </div>
                {exercise.notes && <p className="rounded-2xl bg-white/5 p-3 text-sm text-muted">{exercise.notes}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {exercise.sets.map((set, index) => (
                  <div key={set.id} className="grid grid-cols-[36px_1fr_1fr_70px_44px] items-end gap-2 rounded-2xl bg-black/25 p-2 sm:grid-cols-[44px_1fr_1fr_90px_120px]">
                    <div className="pb-3 text-center text-sm font-semibold text-muted">{set.setNumber}</div>
                    <Field
                      label={`Weight ${session.unit}`}
                      value={set.weight}
                      inputRef={index === 0 ? nextInputRef : undefined}
                      onChange={(value) => app.updateSet(session.id, set.id, { weight: value })}
                    />
                    <Field label="Reps" value={set.reps} onChange={(value) => app.updateSet(session.id, set.id, { reps: value })} />
                    <Field label="RIR" value={set.rir} onChange={(value) => app.updateSet(session.id, set.id, { rir: value })} />
                    <div className="flex gap-1 pb-1">
                      <Button aria-label={`Complete set ${set.setNumber}`} size="icon" variant={set.completedAt ? "default" : "secondary"} onClick={() => complete(set)}>
                        {set.isPersonalRecord ? <Trophy className="size-4" /> : <Check className="size-4" />}
                      </Button>
                      <Button className="hidden sm:inline-flex" aria-label={`Remove set ${set.setNumber}`} size="icon" variant="ghost" onClick={() => app.removeWorkoutSet(session.id, set.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <p className="col-span-full px-10 text-xs text-muted">
                      Previous: {set.previousWeight && set.previousReps ? `${set.previousWeight} ${session.unit} x ${set.previousReps}` : "No previous data"}
                      {set.isPersonalRecord && <span className="ml-3 text-accent">Personal record</span>}
                    </p>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => app.addWorkoutSet(session.id, exercise.id)}>
                  <Plus className="size-4" />
                  Add Set
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputRef,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] text-muted">{label}</span>
      <Input
        ref={inputRef}
        className="numeric-input h-14 text-center text-xl font-semibold"
        inputMode="decimal"
        type="number"
        step="0.5"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
            const index = inputs.indexOf(event.currentTarget);
            inputs[index + 1]?.focus();
          }
        }}
      />
    </label>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
