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
  exercise("ex-shoulder-press", "Machine shoulder press", "Shoulders", ["Triceps"], "Machine", "machine", "Brace against the pad and press overhead without locking out aggressively."),
  exercise("ex-lateral-raise", "Cable lateral raise", "Shoulders", [], "Cable", "isolation", "Lead with the elbow and stop when the upper arm reaches shoulder height."),
  exercise("ex-db-lateral-raise", "Dumbbell lateral raise", "Shoulders", [], "Dumbbells", "isolation", "Use controlled reps and avoid swinging the torso."),
  exercise("ex-triceps-pushdown", "Triceps pushdown", "Triceps", [], "Cable", "isolation", "Keep elbows still and extend fully at the bottom."),
  exercise("ex-overhead-extension", "Overhead triceps extension", "Triceps", [], "Cable", "isolation", "Let the elbows flex deeply, then extend without flaring excessively."),
  exercise("ex-lat-pulldown", "Lat pulldown", "Back", ["Biceps"], "Cable", "compound", "Pull elbows toward the ribs and pause briefly near the chest."),
  exercise("ex-pull-up", "Pull-ups", "Back", ["Biceps"], "Bodyweight", "bodyweight", "Start from a dead hang and pull until the chin clears the bar."),
  exercise("ex-chest-row", "Chest-supported row", "Back", ["Biceps"], "Machine", "compound", "Keep the chest fixed to the pad and row with elbows close to the body."),
  exercise("ex-rear-delt-fly", "Rear-delt fly", "Shoulders", ["Back"], "Machine", "isolation", "Open the arms with a soft elbow and squeeze the rear delts."),
  exercise("ex-incline-curl", "Incline dumbbell curl", "Biceps", [], "Dumbbells", "isolation", "Let the arm extend fully and curl without moving the shoulder."),
  exercise("ex-preacher-curl", "Preacher curl", "Biceps", [], "Machine", "isolation", "Keep upper arms planted and control the lowering phase."),
  exercise("ex-hammer-curl", "Hammer curl", "Biceps", ["Forearms" as MuscleGroup], "Dumbbells", "isolation", "Curl with neutral wrists and avoid torso sway."),
  exercise("ex-squat-leg-press", "Squat or leg press", "Quadriceps", ["Glutes"], "Barbell or machine", "compound", "Use a controlled depth and keep tension through the entire rep."),
  exercise("ex-romanian-deadlift", "Romanian deadlift", "Hamstrings", ["Glutes", "Back"], "Barbell or dumbbells", "compound", "Hinge at the hips, keep lats tight, and stop when hamstrings limit range."),
  exercise("ex-bulgarian-split-squat", "Bulgarian split squat", "Quadriceps", ["Glutes"], "Dumbbells", "compound", "Keep the front foot planted and descend under control on each leg."),
  exercise("ex-leg-curl", "Seated or lying leg curl", "Hamstrings", [], "Machine", "isolation", "Curl hard and return slowly without losing tension."),
  exercise("ex-calf-raise", "Standing calf raise", "Calves", [], "Machine", "isolation", "Pause at the top and use a full stretch at the bottom."),
  exercise("ex-plank", "Weighted plank", "Core", [], "Bodyweight", "bodyweight", "Brace hard and keep ribs down."),
];

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
      id: "routine-push",
      userId: user.id,
      name: "Push",
      kind: "Push",
      scheduledDays: [1, 4],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-push", "ex-incline-db-press", "Incline dumbbell press", 0, 2, 6, 10),
        routineExercise("routine-push", "ex-shoulder-press", "Machine shoulder press", 1, 2, 6, 10),
        routineExercise("routine-push", "ex-lateral-raise", "Cable lateral raise", 2, 2, 12, 20),
        routineExercise("routine-push", "ex-triceps-pushdown", "Triceps pushdown", 3, 3, 8, 12),
        routineExercise("routine-push", "ex-overhead-extension", "Overhead triceps extension", 4, 2, 8, 12),
      ],
    },
    {
      id: "routine-pull",
      userId: user.id,
      name: "Pull",
      kind: "Pull",
      scheduledDays: [2, 5],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-pull", "ex-lat-pulldown", "Lat pulldown", 0, 3, 6, 10),
        routineExercise("routine-pull", "ex-chest-row", "Chest-supported row", 1, 3, 6, 10),
        routineExercise("routine-pull", "ex-rear-delt-fly", "Rear-delt fly", 2, 2, 12, 20),
        routineExercise("routine-pull", "ex-incline-curl", "Incline dumbbell curl", 3, 3, 8, 12),
        routineExercise("routine-pull", "ex-hammer-curl", "Hammer curl", 4, 2, 8, 12),
      ],
    },
    {
      id: "routine-legs",
      userId: user.id,
      name: "Legs",
      kind: "Legs",
      scheduledDays: [6],
      createdAt: now,
      updatedAt: now,
      exercises: [
        routineExercise("routine-legs", "ex-squat-leg-press", "Squat or leg press", 0, 2, 6, 10),
        routineExercise("routine-legs", "ex-romanian-deadlift", "Romanian deadlift", 1, 2, 6, 10),
        routineExercise("routine-legs", "ex-bulgarian-split-squat", "Bulgarian split squat", 2, 2, 8, 12, "Per leg."),
        routineExercise("routine-legs", "ex-leg-curl", "Seated or lying leg curl", 3, 2, 8, 15),
        routineExercise("routine-legs", "ex-calf-raise", "Standing calf raise", 4, 2, 10, 15),
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
