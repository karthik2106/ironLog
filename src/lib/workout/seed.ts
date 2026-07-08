import type { Exercise, MuscleGroup, Routine, RoutineExercise, UserProfile, UserSettings, WorkoutStore } from "./types";

const now = new Date("2026-07-07T08:00:00.000Z").toISOString();

export const demoProfile: UserProfile = {
  id: "demo-user",
  email: "demo@ironlog.local",
  displayName: "Karthik",
  createdAt: now,
};

const exercise = (
  id: string,
  name: string,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[],
  equipment: string,
  category: Exercise["category"],
  instructions: string,
): Exercise => ({
  id,
  userId: null,
  name,
  primaryMuscle,
  secondaryMuscles,
  equipment,
  category,
  instructions,
  isCustom: false,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
});

export const seedExercises: Exercise[] = [
  exercise("ex-incline-db-press", "Incline dumbbell press", "Chest", ["Shoulders", "Triceps"], "Dumbbells", "compound", "Set the bench to a low incline, keep shoulder blades pinned, and press with controlled reps."),
  exercise("ex-machine-press", "Incline machine press", "Chest", ["Shoulders", "Triceps"], "Machine", "machine", "Align handles with upper chest and press without letting shoulders roll forward."),
  exercise("ex-flat-machine-press", "Flat machine press", "Chest", ["Shoulders", "Triceps"], "Machine", "machine", "Set handles around mid-chest and press smoothly without shoulders rolling forward."),
  exercise("ex-shoulder-press", "Machine shoulder press", "Shoulders", ["Triceps"], "Machine", "machine", "Brace against the pad and press overhead without locking out aggressively."),
  exercise("ex-seated-db-shoulder-press", "Seated dumbbell shoulder press", "Shoulders", ["Triceps"], "Dumbbells", "compound", "Press from shoulder height while keeping ribs down and wrists stacked."),
  exercise("ex-lateral-raise", "Cable lateral raise", "Shoulders", [], "Cable", "isolation", "Lead with the elbow and stop when the upper arm reaches shoulder height."),
  exercise("ex-db-lateral-raise", "Dumbbell lateral raise", "Shoulders", [], "Dumbbells", "isolation", "Use controlled reps and avoid swinging the torso."),
  exercise("ex-triceps-pushdown", "Cable triceps pushdown", "Triceps", [], "Cable", "isolation", "Keep elbows still and extend fully at the bottom."),
  exercise("ex-single-arm-cable-pushdown", "Single-arm cable pushdown", "Triceps", [], "Cable", "isolation", "Keep the upper arm pinned and finish each rep with a hard triceps squeeze."),
  exercise("ex-overhead-extension", "Overhead cable triceps extension", "Triceps", [], "Cable", "isolation", "Let the elbows flex deeply, then extend without flaring excessively."),
  exercise("ex-overhead-db-extension", "Overhead dumbbell extension", "Triceps", [], "Dumbbell", "isolation", "Lower the dumbbell behind the head under control and extend without flaring the elbows."),
  exercise("ex-lat-pulldown", "Lat pulldown", "Back", ["Biceps"], "Cable", "compound", "Pull elbows toward the ribs and pause briefly near the chest."),
  exercise("ex-neutral-lat-pulldown", "Neutral-grip lat pulldown", "Back", ["Biceps"], "Cable", "compound", "Drive elbows down with a neutral grip and keep the torso stable."),
  exercise("ex-assisted-pull-up", "Assisted pull-up", "Back", ["Biceps"], "Machine", "bodyweight", "Use enough assistance to control the full range and pull chest toward the bar."),
  exercise("ex-chest-row", "Chest-supported row", "Back", ["Biceps"], "Machine", "compound", "Keep the chest fixed to the pad and row with elbows close to the body."),
  exercise("ex-seated-cable-row", "Seated cable row", "Back", ["Biceps"], "Cable", "compound", "Brace upright and row toward the lower ribs with a controlled return."),
  exercise("ex-one-arm-machine-row", "One-arm machine row", "Back", ["Biceps"], "Machine", "compound", "Pull the handle toward the hip and avoid twisting the torso."),
  exercise("ex-rear-delt-fly", "Reverse pec deck or rear-delt fly", "Shoulders", ["Back"], "Machine", "isolation", "Open the arms with a soft elbow and squeeze the rear delts."),
  exercise("ex-cable-rear-delt-fly", "Cable rear-delt fly", "Shoulders", ["Back"], "Cable", "isolation", "Set cables around shoulder height and sweep the arms out with control."),
  exercise("ex-face-pull", "Face pull", "Shoulders", ["Back"], "Cable", "isolation", "Pull toward the face with elbows high and rotate the hands back slightly."),
  exercise("ex-incline-curl", "Incline dumbbell curl", "Biceps", [], "Dumbbells", "isolation", "Let the arm extend fully and curl without moving the shoulder."),
  exercise("ex-preacher-curl", "Preacher curl", "Biceps", [], "Machine", "isolation", "Keep upper arms planted and control the lowering phase."),
  exercise("ex-hammer-curl", "Hammer curl", "Biceps", ["Forearms" as MuscleGroup], "Dumbbells", "isolation", "Curl with neutral wrists and avoid torso sway."),
  exercise("ex-cable-curl", "Cable curl", "Biceps", [], "Cable", "isolation", "Keep elbows slightly in front of the body and curl with steady cable tension."),
  exercise("ex-cross-body-hammer-curl", "Cross-body hammer curl", "Biceps", ["Forearms" as MuscleGroup], "Dumbbells", "isolation", "Curl the dumbbell across the body with a neutral wrist."),
  exercise("ex-squat-leg-press", "Squat or leg press", "Quadriceps", ["Glutes"], "Barbell or machine", "compound", "Use a controlled depth and keep tension through the entire rep."),
  exercise("ex-romanian-deadlift", "Romanian deadlift", "Hamstrings", ["Glutes", "Back"], "Barbell or dumbbells", "compound", "Hinge at the hips, keep lats tight, and stop when hamstrings limit range."),
  exercise("ex-bulgarian-split-squat", "Bulgarian split squat", "Quadriceps", ["Glutes"], "Dumbbells", "compound", "Keep the front foot planted and descend under control on each leg."),
  exercise("ex-leg-curl", "Seated or lying leg curl", "Hamstrings", [], "Machine", "isolation", "Curl hard and return slowly without losing tension."),
  exercise("ex-calf-raise", "Standing or seated calf raise", "Calves", [], "Machine", "isolation", "Pause at the top and use a full stretch at the bottom."),
  exercise("ex-incline-treadmill-walk", "Incline treadmill walk", "Quadriceps", ["Glutes", "Calves"], "Treadmill", "machine", "Walk at an easy pace on an incline for 10 to 15 minutes."),
  exercise("ex-plank", "Weighted plank", "Core", [], "Bodyweight", "bodyweight", "Brace hard and keep ribs down."),
];

export const defaultRoutineIds = ["routine-push-a", "routine-pull-a", "routine-legs", "routine-push-b", "routine-pull-b"];

const routineExercise = (
  routineId: string,
  exerciseId: string,
  name: string,
  sortOrder: number,
  targetSets: number,
  minReps: number,
  maxReps: number,
  notes = "",
): RoutineExercise => ({
  id: `${routineId}-${sortOrder}`,
  routineId,
  exerciseId,
  exerciseNameSnapshot: name,
  sortOrder,
  targetSets,
  minReps,
  maxReps,
  targetRir: 1,
  notes,
  archivedAt: null,
});

export function createSeedStore(user: UserProfile = demoProfile): WorkoutStore {
  const routines: Routine[] = [
    {
      id: "routine-push-a",
      userId: user.id,
      name: "Push A",
      kind: "Push",
      scheduledDays: [],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-push-a", "ex-incline-db-press", "Incline dumbbell press", 0, 2, 6, 10),
        routineExercise("routine-push-a", "ex-shoulder-press", "Machine shoulder press", 1, 2, 6, 10),
        routineExercise("routine-push-a", "ex-lateral-raise", "Cable lateral raise", 2, 2, 12, 20),
        routineExercise("routine-push-a", "ex-triceps-pushdown", "Cable triceps pushdown", 3, 3, 8, 12),
        routineExercise("routine-push-a", "ex-overhead-extension", "Overhead cable triceps extension", 4, 2, 8, 12),
      ],
    },
    {
      id: "routine-pull-a",
      userId: user.id,
      name: "Pull A",
      kind: "Pull",
      scheduledDays: [],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-pull-a", "ex-lat-pulldown", "Lat pulldown", 0, 3, 6, 10),
        routineExercise("routine-pull-a", "ex-chest-row", "Chest-supported row", 1, 3, 6, 10),
        routineExercise("routine-pull-a", "ex-rear-delt-fly", "Reverse pec deck or rear-delt fly", 2, 2, 12, 20),
        routineExercise("routine-pull-a", "ex-incline-curl", "Incline dumbbell curl", 3, 3, 8, 12),
        routineExercise("routine-pull-a", "ex-hammer-curl", "Hammer curl", 4, 2, 8, 12),
      ],
    },
    {
      id: "routine-legs",
      userId: user.id,
      name: "Legs",
      kind: "Legs",
      scheduledDays: [],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-legs", "ex-squat-leg-press", "Squat or leg press", 0, 2, 6, 10),
        routineExercise("routine-legs", "ex-romanian-deadlift", "Romanian deadlift", 1, 2, 6, 10),
        routineExercise("routine-legs", "ex-bulgarian-split-squat", "Bulgarian split squat", 2, 2, 8, 12, "Per leg."),
        routineExercise("routine-legs", "ex-leg-curl", "Seated or lying leg curl", 3, 2, 8, 15),
        routineExercise("routine-legs", "ex-calf-raise", "Standing or seated calf raise", 4, 2, 10, 15),
      ],
    },
    {
      id: "routine-push-b",
      userId: user.id,
      name: "Push B",
      kind: "Push",
      scheduledDays: [],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-push-b", "ex-machine-press", "Incline machine press", 0, 2, 6, 10, "Use a different press from Push A. Flat machine press is also fine."),
        routineExercise("routine-push-b", "ex-seated-db-shoulder-press", "Seated dumbbell shoulder press", 1, 2, 6, 10, "Machine shoulder press is also fine."),
        routineExercise("routine-push-b", "ex-db-lateral-raise", "Dumbbell or cable lateral raise", 2, 2, 12, 20),
        routineExercise("routine-push-b", "ex-single-arm-cable-pushdown", "Single-arm cable pushdown", 3, 3, 8, 12),
        routineExercise("routine-push-b", "ex-overhead-db-extension", "Overhead dumbbell or cable extension", 4, 2, 8, 12),
      ],
    },
    {
      id: "routine-pull-b",
      userId: user.id,
      name: "Pull B",
      kind: "Pull",
      scheduledDays: [],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-pull-b", "ex-neutral-lat-pulldown", "Neutral-grip lat pulldown", 0, 3, 6, 10, "Assisted pull-up is also fine."),
        routineExercise("routine-pull-b", "ex-seated-cable-row", "Seated cable row", 1, 3, 6, 10, "One-arm machine row is also fine."),
        routineExercise("routine-pull-b", "ex-cable-rear-delt-fly", "Cable rear-delt fly", 2, 2, 12, 20, "Face pull is also fine."),
        routineExercise("routine-pull-b", "ex-preacher-curl", "Preacher curl", 3, 3, 8, 12),
        routineExercise("routine-pull-b", "ex-cable-curl", "Cable curl", 4, 2, 8, 12, "Cross-body hammer curl is also fine."),
      ],
    },
  ];

  const settings: UserSettings = {
    userId: user.id,
    unit: "kg",
    defaultRestSeconds: 90,
    autoStartRestTimer: true,
    weekStartDay: 1,
    theme: "dark",
    soundEnabled: true,
    vibrationEnabled: true,
  };

  return {
    profile: user,
    exercises: seedExercises,
    routines,
    sessions: [],
    personalRecords: [],
    settings,
  };
}

export function applyDefaultTrainingPlan(store: WorkoutStore): WorkoutStore {
  const seed = createSeedStore(store.profile);
  const exerciseIds = new Set(seedExercises.map((exercise) => exercise.id));
  const customExercises = store.exercises.filter((exercise) => exercise.userId && !exerciseIds.has(exercise.id));
  const hasNewPlan = defaultRoutineIds.every((id) => store.routines.some((routine) => routine.id === id && !routine.archivedAt));

  if (hasNewPlan) {
    return {
      ...store,
      exercises: [...seedExercises, ...customExercises],
      routines: store.routines.map((routine) => ({ ...routine, scheduledDays: [] })),
    };
  }

  const retiredDefaultIds = new Set(["routine-push", "routine-pull", "routine-legs", ...defaultRoutineIds]);
  const retiredDefaultNames = new Set(["Push", "Pull", "Legs", "Push A", "Pull A", "Push B", "Pull B"]);
  const customRoutines = store.routines.filter((routine) => !retiredDefaultIds.has(routine.id) && !retiredDefaultNames.has(routine.name));

  return {
    ...store,
    exercises: [...seedExercises, ...customExercises],
    routines: [...seed.routines, ...customRoutines.map((routine) => ({ ...routine, scheduledDays: [] }))],
  };
}
