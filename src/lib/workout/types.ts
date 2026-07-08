export type Unit = "kg" | "lb";
export type RoutineKind = "Push" | "Pull" | "Legs" | "Custom";
export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quadriceps"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core";

export type ExerciseCategory = "compound" | "isolation" | "bodyweight" | "machine";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type Exercise = {
  id: string;
  userId: string | null;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  category: ExerciseCategory;
  instructions: string;
  notes?: string;
  isCustom: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoutineExercise = {
  id: string;
  routineId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  sortOrder: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  targetRir?: number | null;
  notes?: string;
  archivedAt?: string | null;
};

export type Routine = {
  id: string;
  userId: string;
  name: string;
  kind: RoutineKind;
  scheduledDays: number[];
  exercises: RoutineExercise[];
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSet = {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  targetMinReps: number;
  targetMaxReps: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  completedAt: string | null;
  previousWeight?: number | null;
  previousReps?: number | null;
  isPersonalRecord?: boolean;
};

export type WorkoutExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  primaryMuscleSnapshot: MuscleGroup;
  routineExerciseId?: string;
  sortOrder: number;
  targetRir?: number | null;
  notes?: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  userId: string;
  routineId: string | null;
  routineNameSnapshot: string;
  status: "active" | "completed";
  unit: Unit;
  startedAt: string;
  finishedAt?: string | null;
  durationSeconds?: number;
  notes?: string;
  rating?: number;
  exercises: WorkoutExercise[];
};

export type PersonalRecord = {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  type: "weight" | "reps" | "estimated_1rm" | "volume";
  value: number;
  unit: Unit;
  achievedAt: string;
  workoutSetId: string;
};

export type UserSettings = {
  userId: string;
  unit: Unit;
  defaultRestSeconds: number;
  autoStartRestTimer: boolean;
  weekStartDay: number;
  theme: "system" | "dark";
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export type WorkoutStore = {
  profile: UserProfile;
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  settings: UserSettings;
};

export type WorkoutSummary = {
  durationSeconds: number;
  completedSets: number;
  totalReps: number;
  totalVolume: number;
  exercisesCompleted: number;
  personalRecords: PersonalRecord[];
  previousVolumeDelta: number | null;
};
