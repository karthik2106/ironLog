"use client";

import { Archive, Edit3, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useApp } from "@/features/auth/app-provider";
import type { Exercise, ExerciseCategory, MuscleGroup } from "@/lib/workout/types";

const muscles: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quadriceps", "Hamstrings", "Glutes", "Calves", "Core"];
const categories: ExerciseCategory[] = ["compound", "isolation", "bodyweight", "machine"];

export function ExerciseLibraryScreen() {
  const app = useApp();
  const { store } = app;
  const [filter, setFilter] = useState<MuscleGroup | "All">("All");
  const [query, setQuery] = useState("");

  const exercises = useMemo(
    () =>
      store.exercises.filter((exercise) => {
        if (exercise.archivedAt) return false;
        if (filter !== "All" && exercise.primaryMuscle !== filter) return false;
        if (query.trim() && !exercise.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      }),
    [filter, query, store.exercises],
  );

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted">Exercise Library</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Manage your movements</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Add custom exercises, filter by muscle group, and add any movement to Push, Pull, Legs, or a custom split.
            </p>
          </div>
          <ExerciseDialog mode="create" />
        </header>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <Input placeholder="Search exercises" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="flex gap-2 overflow-auto pb-1">
              {["All", ...muscles].map((muscle) => (
                <Button key={muscle} size="sm" variant={filter === muscle ? "default" : "secondary"} onClick={() => setFilter(muscle as MuscleGroup | "All")}>
                  {muscle}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {exercises.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted">No exercises match that filter.</CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const app = useApp();
  const { store } = app;
  const [routineId, setRoutineId] = useState(store.routines.find((routine) => !routine.archivedAt)?.id ?? "");
  const isCustom = exercise.userId === store.profile.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{exercise.name}</CardTitle>
            <CardDescription>
              {exercise.equipment} · {exercise.category}
            </CardDescription>
          </div>
          <Badge>{exercise.primaryMuscle}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted">{exercise.instructions}</p>
        {exercise.secondaryMuscles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {exercise.secondaryMuscles.map((muscle) => (
              <Badge key={muscle}>{muscle}</Badge>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select className="min-h-11 rounded-2xl border border-border bg-black/25 px-3 text-sm" value={routineId} onChange={(event) => setRoutineId(event.target.value)}>
            {store.routines
              .filter((routine) => !routine.archivedAt)
              .map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              if (!routineId) return toast.error("Create a routine first");
              app.addExerciseToRoutine(routineId, exercise.id);
              toast.success(`Added to ${store.routines.find((routine) => routine.id === routineId)?.name ?? "routine"}`);
            }}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {isCustom && (
          <div className="flex gap-2">
            <ExerciseDialog mode="edit" exercise={exercise} />
            <Button variant="danger" onClick={() => window.confirm("Archive this custom exercise?") && app.archiveExercise(exercise.id)}>
              <Archive className="size-4" />
              Archive
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExerciseDialog({ mode, exercise }: { mode: "create" | "edit"; exercise?: Exercise }) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(exercise?.name ?? "");
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>(exercise?.primaryMuscle ?? "Chest");
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category ?? "isolation");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [notes, setNotes] = useState(exercise?.notes ?? "");

  function save() {
    if (!name || !equipment || !instructions) {
      toast.error("Fill in name, equipment, and instructions");
      return;
    }

    if (mode === "edit" && exercise) {
      app.updateCustomExercise(exercise.id, { name, primaryMuscle, equipment, category, instructions, notes });
    } else {
      app.createCustomExercise({
        name,
        primaryMuscle,
        secondaryMuscles: [],
        equipment,
        category,
        instructions,
        notes,
        archivedAt: null,
      });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "edit" ? "secondary" : "default"}>
          {mode === "edit" ? <Edit3 className="size-4" /> : <Plus className="size-4" />}
          {mode === "edit" ? "Edit" : "Create exercise"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit exercise" : "Create custom exercise"}</DialogTitle>
          <DialogDescription>{mode === "edit" ? "Update your custom exercise details." : "Add a movement to your private library."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary muscle</Label>
              <select className="min-h-11 w-full rounded-2xl border border-border bg-black/25 px-3" value={primaryMuscle} onChange={(event) => setPrimaryMuscle(event.target.value as MuscleGroup)}>
                {muscles.map((muscle) => (
                  <option key={muscle}>{muscle}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="min-h-11 w-full rounded-2xl border border-border bg-black/25 px-3" value={category} onChange={(event) => setCategory(event.target.value as ExerciseCategory)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Input value={equipment} onChange={(event) => setEquipment(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <Button className="w-full" onClick={save}>
            Save exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
