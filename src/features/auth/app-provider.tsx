"use client";

import * as React from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import {
  createWorkoutFromRoutine,
  duplicateRoutine,
  finishWorkout,
  replaceRoutineExercise,
  saveSet,
  updateRoutineExercise,
} from "@/lib/workout/engine";
import { applyDefaultTrainingPlan, createSeedStore, demoProfile } from "@/lib/workout/seed";
import type { Exercise, Routine, RoutineExercise, UserProfile, UserSettings, WorkoutSession, WorkoutStore } from "@/lib/workout/types";

type AuthMode = "loading" | "signed-out" | "signed-in";

type AppContextValue = {
  authMode: AuthMode;
  isDemoMode: boolean;
  store: WorkoutStore;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  useDemoAccount: () => void;
  signOut: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  createRoutine: () => void;
  renameRoutine: (routineId: string, name: string) => void;
  updateRoutineSchedule: (routineId: string, days: number[]) => void;
  duplicateRoutineById: (routineId: string) => void;
  deleteRoutine: (routineId: string) => void;
  updateRoutineExerciseById: (routineId: string, exerciseId: string, patch: Partial<RoutineExercise>) => void;
  reorderRoutineExercises: (routineId: string, activeId: string, overId: string) => void;
  addExerciseToRoutine: (routineId: string, exerciseId: string) => void;
  removeRoutineExercise: (routineId: string, routineExerciseId: string) => void;
  replaceExercise: (routineId: string, routineExerciseId: string, exercise: Exercise) => void;
  createCustomExercise: (exercise: Omit<Exercise, "id" | "userId" | "isCustom" | "createdAt" | "updatedAt">) => void;
  updateCustomExercise: (exerciseId: string, patch: Partial<Omit<Exercise, "id" | "userId" | "isCustom" | "createdAt">>) => void;
  archiveExercise: (exerciseId: string) => void;
  startWorkout: (routineId: string) => WorkoutSession | null;
  updateSet: (sessionId: string, setId: string, patch: Parameters<typeof saveSet>[3]) => void;
  completeSet: (sessionId: string, setId: string) => void;
  addWorkoutSet: (sessionId: string, workoutExerciseId: string) => void;
  removeWorkoutSet: (sessionId: string, setId: string) => void;
  finishActiveWorkout: (sessionId: string, notes: string, rating: number) => void;
  exportJson: () => string;
  resetDemoData: () => void;
};

const AppContext = React.createContext<AppContextValue | null>(null);
const STORAGE_PREFIX = "ironlog-store:";
const ACTIVE_USER_KEY = "ironlog-active-user";
const CLOUD_TOKEN_KEY = "ironlog-cloud-token";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authMode, setAuthMode] = React.useState<AuthMode>("loading");
  const [isDemoMode, setIsDemoMode] = React.useState(true);
  const [store, setStore] = React.useState<WorkoutStore>(() => createSeedStore());

  React.useEffect(() => {
    async function boot() {
      const cloudToken = window.localStorage.getItem(CLOUD_TOKEN_KEY);
      if (cloudToken) {
        const cloud = await loadCloudStore(cloudToken);
        if (cloud) {
          setStore(applyDefaultTrainingPlan(cloud.store));
          setIsDemoMode(false);
          setAuthMode("signed-in");
          window.localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(cloud.profile));
          return;
        }
        window.localStorage.removeItem(CLOUD_TOKEN_KEY);
      }

      const activeUser = window.localStorage.getItem(ACTIVE_USER_KEY);
      if (activeUser) {
        const parsed = JSON.parse(activeUser) as UserProfile;
        setStore(applyDefaultTrainingPlan(loadStore(parsed)));
        setIsDemoMode(parsed.id === demoProfile.id);
        setAuthMode("signed-in");
      } else {
        setStore(loadStore(demoProfile));
        setIsDemoMode(true);
        setAuthMode("signed-in");
      }
    }
    void boot();
  }, []);

  React.useEffect(() => {
    if (authMode === "signed-in") {
      window.localStorage.setItem(storageKey(store.profile.id), JSON.stringify(store));
      window.localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(store.profile));
    }
  }, [authMode, store]);

  React.useEffect(() => {
    if (authMode !== "signed-in" || isDemoMode) return;
    const token = window.localStorage.getItem(CLOUD_TOKEN_KEY);
    if (!token) return;
    const timeout = window.setTimeout(() => {
      void syncCloudStore(token, store);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [authMode, isDemoMode, store]);

  const value = React.useMemo<AppContextValue>(
    () => ({
      authMode,
      isDemoMode,
      store,
      async signIn(email, password) {
        const cloud = await cloudSignIn(email, password);
        if (cloud) {
          window.localStorage.setItem(CLOUD_TOKEN_KEY, cloud.token);
          window.localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(cloud.profile));
          setStore(applyDefaultTrainingPlan(cloud.store));
          setIsDemoMode(false);
          setAuthMode("signed-in");
          toast.success("Signed in with cloud sync");
          return;
        }
        const profile = { ...demoProfile, id: `local-${email}`, email, displayName: email.split("@")[0] || "Athlete" };
        setStore(loadStore(profile));
        setIsDemoMode(false);
        setAuthMode("signed-in");
        toast.success("Signed in locally");
      },
      async signUp(email, password, displayName) {
        const cloud = await cloudSignUp(email, password, displayName);
        if (cloud) {
          window.localStorage.setItem(CLOUD_TOKEN_KEY, cloud.token);
          window.localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(cloud.profile));
          setStore(applyDefaultTrainingPlan(cloud.store));
          setIsDemoMode(false);
          setAuthMode("signed-in");
          toast.success("Cloud account created");
          return;
        }
        const profile = { ...demoProfile, id: `local-${email}`, email, displayName };
        setStore(loadStore(profile));
        setIsDemoMode(false);
        setAuthMode("signed-in");
        toast.success("Local account created");
      },
      useDemoAccount() {
        setStore(loadStore(demoProfile));
        setIsDemoMode(true);
        setAuthMode("signed-in");
        toast.success("Demo mode ready");
      },
      async signOut() {
        window.localStorage.removeItem(CLOUD_TOKEN_KEY);
        const next = loadStore(demoProfile);
        setStore(next);
        setIsDemoMode(true);
        setAuthMode("signed-in");
      },
      updateSettings(settings) {
        setStore((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
      },
      createRoutine() {
        setStore((current) => {
          const id = uuid();
          const routine: Routine = {
            id,
            userId: current.profile.id,
            name: "New Routine",
            kind: "Custom",
            scheduledDays: [],
            exercises: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { ...current, routines: [...current.routines, routine] };
        });
      },
      renameRoutine(routineId, name) {
        setStore((current) => ({
          ...current,
          routines: current.routines.map((routine) =>
            routine.id === routineId && routine.userId === current.profile.id ? { ...routine, name, updatedAt: new Date().toISOString() } : routine,
          ),
        }));
      },
      updateRoutineSchedule(routineId, days) {
        setStore((current) => ({
          ...current,
          routines: current.routines.map((routine) =>
            routine.id === routineId && routine.userId === current.profile.id
              ? { ...routine, scheduledDays: days, updatedAt: new Date().toISOString() }
              : routine,
          ),
        }));
      },
      duplicateRoutineById(routineId) {
        setStore((current) => duplicateRoutine(current, routineId));
        toast.success("Routine duplicated");
      },
      deleteRoutine(routineId) {
        setStore((current) => ({
          ...current,
          routines: current.routines.map((routine) =>
            routine.id === routineId && routine.userId === current.profile.id ? { ...routine, archivedAt: new Date().toISOString() } : routine,
          ),
        }));
        toast.success("Routine archived");
      },
      updateRoutineExerciseById(routineId, exerciseId, patch) {
        setStore((current) => updateRoutineExercise(current, routineId, exerciseId, patch));
      },
      reorderRoutineExercises(routineId, activeId, overId) {
        setStore((current) => ({
          ...current,
          routines: current.routines.map((routine) => {
            if (routine.id !== routineId) return routine;
            const items = [...routine.exercises].sort((a, b) => a.sortOrder - b.sortOrder);
            const from = items.findIndex((item) => item.id === activeId);
            const to = items.findIndex((item) => item.id === overId);
            if (from < 0 || to < 0) return routine;
            const [moved] = items.splice(from, 1);
            items.splice(to, 0, moved);
            return { ...routine, exercises: items.map((item, index) => ({ ...item, sortOrder: index })) };
          }),
        }));
      },
      addExerciseToRoutine(routineId, exerciseId) {
        setStore((current) => ({
          ...current,
          routines: current.routines.map((routine) => {
            if (routine.id !== routineId) return routine;
            const exercise = current.exercises.find((item) => item.id === exerciseId);
            if (!exercise) return routine;
            return {
              ...routine,
              exercises: [
                ...routine.exercises,
                {
                  id: uuid(),
                  routineId,
                  exerciseId,
                  exerciseNameSnapshot: exercise.name,
                  sortOrder: routine.exercises.length,
                  targetSets: 2,
                  minReps: 8,
                  maxReps: 12,
                  targetRir: 1,
                  notes: "",
                  archivedAt: null,
                },
              ],
            };
          }),
        }));
      },
      removeRoutineExercise(routineId, routineExerciseId) {
        setStore((current) => updateRoutineExercise(current, routineId, routineExerciseId, { archivedAt: new Date().toISOString() }));
      },
      replaceExercise(routineId, routineExerciseId, exercise) {
        setStore((current) => replaceRoutineExercise(current, routineId, routineExerciseId, exercise));
      },
      createCustomExercise(exercise) {
        setStore((current) => ({
          ...current,
          exercises: [
            ...current.exercises,
            {
              ...exercise,
              id: uuid(),
              userId: current.profile.id,
              isCustom: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
        toast.success("Exercise added");
      },
      updateCustomExercise(exerciseId, patch) {
        setStore((current) => ({
          ...current,
          exercises: current.exercises.map((exercise) =>
            exercise.id === exerciseId && exercise.userId === current.profile.id
              ? { ...exercise, ...patch, updatedAt: new Date().toISOString() }
              : exercise,
          ),
        }));
        toast.success("Exercise updated");
      },
      archiveExercise(exerciseId) {
        setStore((current) => ({
          ...current,
          exercises: current.exercises.map((exercise) =>
            exercise.id === exerciseId && exercise.userId === current.profile.id ? { ...exercise, archivedAt: new Date().toISOString() } : exercise,
          ),
        }));
      },
      startWorkout(routineId) {
        let nextSession: WorkoutSession | null = null;
        setStore((current) => {
          const next = createWorkoutFromRoutine(current, routineId);
          nextSession = next.sessions[0] ?? null;
          return next;
        });
        toast.success("Workout started");
        return nextSession;
      },
      updateSet(sessionId, setId, patch) {
        setStore((current) => saveSet(current, sessionId, setId, patch));
      },
      completeSet(sessionId, setId) {
        setStore((current) => saveSet(current, sessionId, setId, { completedAt: new Date().toISOString() }));
      },
      addWorkoutSet(sessionId, workoutExerciseId) {
        setStore((current) => ({
          ...current,
          sessions: current.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  exercises: session.exercises.map((exercise) =>
                    exercise.id !== workoutExerciseId
                      ? exercise
                      : {
                          ...exercise,
                          sets: [
                            ...exercise.sets,
                            {
                              ...exercise.sets[exercise.sets.length - 1],
                              id: uuid(),
                              setNumber: exercise.sets.length + 1,
                              weight: null,
                              reps: null,
                              completedAt: null,
                              isPersonalRecord: false,
                            },
                          ],
                        },
                  ),
                },
          ),
        }));
      },
      removeWorkoutSet(sessionId, setId) {
        setStore((current) => ({
          ...current,
          sessions: current.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  exercises: session.exercises.map((exercise) => ({
                    ...exercise,
                    sets: exercise.sets.filter((set) => set.id !== setId).map((set, index) => ({ ...set, setNumber: index + 1 })),
                  })),
                },
          ),
        }));
      },
      finishActiveWorkout(sessionId, notes, rating) {
        setStore((current) => finishWorkout(current, sessionId, notes, rating));
        toast.success("Workout completed");
      },
      exportJson() {
        return JSON.stringify(store, null, 2);
      },
      resetDemoData() {
        const next = createSeedStore(store.profile);
        setStore(next);
        toast.success("Demo data reset");
      },
    }),
    [authMode, isDemoMode, store],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadStore(profile: UserProfile): WorkoutStore {
  const existing = window.localStorage.getItem(storageKey(profile.id));
  if (existing) return applyDefaultTrainingPlan(JSON.parse(existing) as WorkoutStore);
  return createSeedStore(profile);
}

type CloudAuthPayload = {
  profile: UserProfile;
  store: WorkoutStore;
  token: string;
};

async function cloudSignIn(email: string, password: string) {
  return cloudAuthRequest("/api/auth/sign-in", { email, password });
}

async function cloudSignUp(email: string, password: string, displayName: string) {
  return cloudAuthRequest("/api/auth/sign-up", { email, password, displayName });
}

async function cloudAuthRequest(path: string, payload: unknown): Promise<CloudAuthPayload | null> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 503) return null;
  const body = (await response.json()) as CloudAuthPayload | { error?: string };
  if (!response.ok) {
    throw new Error("error" in body && body.error ? body.error : "Cloud authentication failed.");
  }
  return body as CloudAuthPayload;
}

async function loadCloudStore(token: string): Promise<{ profile: UserProfile; store: WorkoutStore } | null> {
  const response = await fetch("/api/store", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { profile: UserProfile; store: WorkoutStore | null };
  if (!body.store) return null;
  return { profile: body.profile, store: applyDefaultTrainingPlan(body.store) };
}

async function syncCloudStore(token: string, store: WorkoutStore) {
  const response = await fetch("/api/store", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ store }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    toast.error(body.error ?? "Cloud sync failed");
  }
}
