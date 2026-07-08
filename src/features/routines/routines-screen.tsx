"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Copy, Dumbbell, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { AppShell } from "@/components/layout/app-shell";
import { useApp } from "@/features/auth/app-provider";
import type { Exercise, RoutineExercise } from "@/lib/workout/types";

export function RoutinesScreen() {
  const app = useApp();
  const { store } = app;
  const [selectedRoutineId, setSelectedRoutineId] = useState(store.routines.find((routine) => !routine.archivedAt)?.id ?? "");
  const selected = store.routines.find((routine) => routine.id === selectedRoutineId) ?? store.routines[0];

  function onDragEnd(event: DragEndEvent) {
    if (event.over && event.active.id !== event.over.id) {
      app.reorderRoutineExercises(selected.id, String(event.active.id), String(event.over.id));
    }
  }

  return (
    <AppShell>
      <div className="grid gap-5 animate-fade-up xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <header>
            <p className="text-sm text-muted">Routines</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Editable PPL plan</h1>
          </header>
          <Button className="w-full" onClick={app.createRoutine}>
            <Plus className="size-4" />
            Create routine
          </Button>
          <div className="space-y-2">
            {store.routines
              .filter((routine) => !routine.archivedAt)
              .map((routine) => (
                <button
                  key={routine.id}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === routine.id ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-white/5"
                  }`}
                  onClick={() => setSelectedRoutineId(routine.id)}
                >
                  <p className="font-semibold">{routine.name}</p>
                  <p className="mt-1 text-sm text-muted">{routine.exercises.filter((exercise) => !exercise.archivedAt).length} exercises</p>
                </button>
              ))}
          </div>
        </aside>

        {selected && (
          <section className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-3 pt-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <Label htmlFor="routine-name">Routine name</Label>
                  <Input id="routine-name" value={selected.name} onChange={(event) => app.renameRoutine(selected.id, event.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => app.duplicateRoutineById(selected.id)}>
                    <Copy className="size-4" />
                    Duplicate
                  </Button>
                  <Button variant="danger" onClick={() => window.confirm("Archive this routine?") && app.deleteRoutine(selected.id)}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DndContext onDragEnd={onDragEnd}>
              <SortableContext items={selected.exercises.filter((exercise) => !exercise.archivedAt).map((exercise) => exercise.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {selected.exercises
                    .filter((exercise) => !exercise.archivedAt)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((exercise) => (
                      <RoutineExerciseCard key={exercise.id} routineId={selected.id} exercise={exercise} library={store.exercises} />
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            <Card>
              <CardHeader>
                <CardTitle>Add exercises</CardTitle>
                <CardDescription>The full exercise library now has its own page in the navigation.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <AddExerciseDialog routineId={selected.id} routineName={selected.name} library={store.exercises} />
                <Button asChild variant="secondary">
                  <Link href="/exercises">
                    <Dumbbell className="size-4" />
                    Open Exercise Library
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function AddExerciseDialog({ routineId, routineName, library }: { routineId: string; routineName: string; library: Exercise[] }) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [exerciseId, setExerciseId] = useState(library.find((exercise) => !exercise.archivedAt)?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exercise to {routineName}</DialogTitle>
          <DialogDescription>Choose from the library. Create new custom exercises from the Exercise Library page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <select className="min-h-12 w-full rounded-2xl border border-border bg-black/25 px-3" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
            {library
              .filter((exercise) => !exercise.archivedAt)
              .map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
          </select>
          <Button
            className="w-full"
            onClick={() => {
              if (!exerciseId) return;
              app.addExerciseToRoutine(routineId, exerciseId);
              setOpen(false);
              toast.success(`Added to ${routineName}`);
            }}
          >
            Add to routine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoutineExerciseCard({ routineId, exercise, library }: { routineId: string; exercise: RoutineExercise; library: Exercise[] }) {
  const app = useApp();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="grid gap-3 pt-5 lg:grid-cols-[36px_1fr_96px_96px_96px_96px_1fr_auto] lg:items-end">
        <button className="hidden cursor-grab pb-3 text-muted lg:block" {...attributes} {...listeners} aria-label="Reorder exercise">
          <GripVertical className="size-5" />
        </button>
        <div>
          <Label>Exercise</Label>
          <p className="mt-3 font-semibold">{exercise.exerciseNameSnapshot}</p>
        </div>
        <NumberEdit label="Sets" value={exercise.targetSets} onChange={(value) => app.updateRoutineExerciseById(routineId, exercise.id, { targetSets: value })} />
        <NumberEdit label="Min reps" value={exercise.minReps} onChange={(value) => app.updateRoutineExerciseById(routineId, exercise.id, { minReps: value })} />
        <NumberEdit label="Max reps" value={exercise.maxReps} onChange={(value) => app.updateRoutineExerciseById(routineId, exercise.id, { maxReps: value })} />
        <NumberEdit label="RIR" value={exercise.targetRir ?? 0} onChange={(value) => app.updateRoutineExerciseById(routineId, exercise.id, { targetRir: value })} />
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input
            value={exercise.notes ?? ""}
            placeholder="Notes"
            onChange={(event) => app.updateRoutineExerciseById(routineId, exercise.id, { notes: event.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="min-h-11 rounded-2xl border border-border bg-black/25 px-3 text-sm"
            aria-label="Replace exercise"
            onChange={(event) => {
              const replacement = library.find((item) => item.id === event.target.value);
              if (replacement) app.replaceExercise(routineId, exercise.id, replacement);
            }}
            value={exercise.exerciseId}
          >
            {library.filter((item) => !item.archivedAt).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button variant="danger" size="icon" onClick={() => window.confirm("Remove this exercise from the routine?") && app.removeRoutineExercise(routineId, exercise.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberEdit({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input className="numeric-input text-center text-lg font-semibold" type="number" min={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
