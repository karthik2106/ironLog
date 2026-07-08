import { v4 as uuid } from "uuid";
import type {
  Exercise,
  PersonalRecord,
  Routine,
  RoutineExercise,
  Unit,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutStore,
  WorkoutSummary,
} from "./types";

export const KG_PER_LB = 0.45359237;

export function convertWeight(value: number, from: Unit, to: Unit) {
  if (from === to) return roundWeight(value);
  return roundWeight(from === "kg" ? value / KG_PER_LB : value * KG_PER_LB);
}

export function roundWeight(value: number) {
  return Math.round(value * 10) / 10;
}

// Epley formula: estimated 1RM = weight * (1 + reps / 30). It is simple, stable,
// and sensible for typical hypertrophy rep ranges used by this app.
export function estimatedOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  return roundWeight(weight * (1 + reps / 30));
}

export function setVolume(set: Pick<WorkoutSet, "weight" | "reps">) {
  return (set.weight ?? 0) * (set.reps ?? 0);
}

export function createWorkoutFromRoutine(store: WorkoutStore, routineId: string, startedAt = new Date().toISOString()) {
  const routine = store.routines.find((item) => item.id === routineId && item.userId === store.profile.id);
  if (!routine) throw new Error("Routine not found");

  const exercises = routine.exercises
    .filter((item) => !item.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((routineExercise) => createWorkoutExercise(store, routineExercise));

  const session: WorkoutSession = attachSessionIds({
    id: uuid(),
    userId: store.profile.id,
    routineId: routine.id,
    routineNameSnapshot: routine.name,
    status: "active",
    unit: store.settings.unit,
    startedAt,
    finishedAt: null,
    exercises,
  });

  return {
    ...store,
    sessions: [session, ...store.sessions],
  };
}

function createWorkoutExercise(store: WorkoutStore, routineExercise: RoutineExercise): WorkoutExercise {
  const exercise = store.exercises.find((item) => item.id === routineExercise.exerciseId);
  const previousSets = findPreviousSets(store, routineExercise.exerciseId);
  const workoutExerciseId = uuid();
  return {
    id: workoutExerciseId,
    sessionId: "",
    exerciseId: routineExercise.exerciseId,
    exerciseNameSnapshot: routineExercise.exerciseNameSnapshot,
    primaryMuscleSnapshot: exercise?.primaryMuscle ?? "Chest",
    routineExerciseId: routineExercise.id,
    sortOrder: routineExercise.sortOrder,
    targetRir: routineExercise.targetRir,
    notes: routineExercise.notes,
    sets: Array.from({ length: routineExercise.targetSets }).map((_, index) => ({
      id: uuid(),
      workoutExerciseId,
      setNumber: index + 1,
      targetMinReps: routineExercise.minReps,
      targetMaxReps: routineExercise.maxReps,
      weight: null,
      reps: null,
      rir: routineExercise.targetRir ?? null,
      completedAt: null,
      previousWeight: previousSets[index]?.weight ?? null,
      previousReps: previousSets[index]?.reps ?? null,
      isPersonalRecord: false,
    })),
  };
}

export function attachSessionIds(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sessionId: session.id,
      sets: exercise.sets.map((set) => ({ ...set, workoutExerciseId: exercise.id })),
    })),
  };
}

export function saveSet(
  store: WorkoutStore,
  sessionId: string,
  setId: string,
  patch: Partial<Pick<WorkoutSet, "weight" | "reps" | "rir" | "completedAt">>,
) {
  const records: PersonalRecord[] = [];
  const sessions = store.sessions.map((session) => {
    if (session.id !== sessionId || session.userId !== store.profile.id) return session;
    return {
      ...session,
      exercises: session.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.id !== setId) return set;
          const nextSet = { ...set, ...patch };
          const newlyCompleted = !set.completedAt && nextSet.completedAt && nextSet.weight && nextSet.reps;
          if (newlyCompleted) {
            const detected = detectPersonalRecords(store, exercise, nextSet);
            records.push(...detected);
            return { ...nextSet, isPersonalRecord: detected.length > 0 };
          }
          return nextSet;
        }),
      })),
    };
  });

  return {
    ...store,
    sessions,
    personalRecords: [...records, ...store.personalRecords],
  };
}

export function finishWorkout(
  store: WorkoutStore,
  sessionId: string,
  notes = "",
  rating = 4,
  finishedAt = new Date().toISOString(),
) {
  return {
    ...store,
    sessions: store.sessions.map((session) => {
      if (session.id !== sessionId || session.userId !== store.profile.id) return session;
      const durationSeconds = Math.max(0, Math.round((new Date(finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000));
      return {
        ...session,
        status: "completed" as const,
        finishedAt,
        durationSeconds,
        notes,
        rating,
      };
    }),
  };
}

export function summarizeWorkout(store: WorkoutStore, session: WorkoutSession): WorkoutSummary {
  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completedAt);
  const totalVolume = completedSets.reduce((sum, set) => sum + setVolume(set), 0);
  const totalReps = completedSets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
  const previous = store.sessions.find(
    (item) =>
      item.id !== session.id &&
      item.status === "completed" &&
      item.routineNameSnapshot === session.routineNameSnapshot &&
      item.userId === session.userId,
  );
  const previousVolume = previous
    ? previous.exercises.flatMap((exercise) => exercise.sets).reduce((sum, set) => sum + setVolume(set), 0)
    : null;

  return {
    durationSeconds:
      session.durationSeconds ??
      Math.max(0, Math.round(((session.finishedAt ? new Date(session.finishedAt) : new Date()).getTime() - new Date(session.startedAt).getTime()) / 1000)),
    completedSets: completedSets.length,
    totalReps,
    totalVolume: roundWeight(totalVolume),
    exercisesCompleted: session.exercises.filter((exercise) => exercise.sets.some((set) => set.completedAt)).length,
    personalRecords: store.personalRecords.filter((record) => completedSets.some((set) => set.id === record.workoutSetId)),
    previousVolumeDelta: previousVolume === null ? null : roundWeight(totalVolume - previousVolume),
  };
}

export function duplicateRoutine(store: WorkoutStore, routineId: string) {
  const routine = store.routines.find((item) => item.id === routineId && item.userId === store.profile.id);
  if (!routine) return store;
  const id = uuid();
  const duplicate: Routine = {
    ...routine,
    id,
    name: `${routine.name} Copy`,
    kind: "Custom",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise, index) => ({
      ...exercise,
      id: uuid(),
      routineId: id,
      sortOrder: index,
    })),
  };
  return { ...store, routines: [...store.routines, duplicate] };
}

export function updateRoutineExercise(store: WorkoutStore, routineId: string, exerciseId: string, patch: Partial<RoutineExercise>) {
  return {
    ...store,
    routines: store.routines.map((routine) =>
      routine.id !== routineId || routine.userId !== store.profile.id
        ? routine
        : {
            ...routine,
            updatedAt: new Date().toISOString(),
            exercises: routine.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, ...patch } : exercise)),
          },
    ),
  };
}

export function replaceRoutineExercise(store: WorkoutStore, routineId: string, routineExerciseId: string, replacement: Exercise) {
  return updateRoutineExercise(store, routineId, routineExerciseId, {
    exerciseId: replacement.id,
    exerciseNameSnapshot: replacement.name,
  });
}

export function recordsBelongToOnlyUser(store: WorkoutStore, userId: string) {
  return (
    store.routines.every((item) => item.userId === userId) &&
    store.sessions.every((item) => item.userId === userId) &&
    store.personalRecords.every((item) => item.userId === userId) &&
    store.settings.userId === userId
  );
}

function detectPersonalRecords(store: WorkoutStore, exercise: WorkoutExercise, set: WorkoutSet): PersonalRecord[] {
  if (!set.weight || !set.reps) return [];
  const achievedAt = set.completedAt ?? new Date().toISOString();
  const previousRecords = store.personalRecords.filter((record) => record.exerciseId === exercise.exerciseId);
  const candidates = [
    { type: "weight" as const, value: set.weight },
    { type: "reps" as const, value: set.reps },
    { type: "volume" as const, value: set.weight * set.reps },
    { type: "estimated_1rm" as const, value: estimatedOneRepMax(set.weight, set.reps) },
  ];

  return candidates
    .filter((candidate) => candidate.value > Math.max(0, ...previousRecords.filter((record) => record.type === candidate.type).map((record) => record.value)))
    .map((candidate) => ({
      id: uuid(),
      userId: store.profile.id,
      exerciseId: exercise.exerciseId,
      exerciseNameSnapshot: exercise.exerciseNameSnapshot,
      type: candidate.type,
      value: roundWeight(candidate.value),
      unit: store.settings.unit,
      achievedAt,
      workoutSetId: set.id,
    }));
}

function findPreviousSets(store: WorkoutStore, exerciseId: string) {
  const previousExercise = store.sessions
    .filter((session) => session.userId === store.profile.id && session.status === "completed")
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.exerciseId === exerciseId);
  return previousExercise?.sets.filter((set) => set.completedAt) ?? [];
}
