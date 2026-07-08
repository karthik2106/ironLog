import { createSeedStore } from "@/lib/workout/seed";
import type { UserProfile, WorkoutStore } from "@/lib/workout/types";

export type CloudAuthResult = {
  profile: UserProfile;
  store: WorkoutStore;
  token: string;
};

export function normalizeCloudStore(store: WorkoutStore, profile: UserProfile): WorkoutStore {
  return {
    ...store,
    profile,
    settings: { ...store.settings, userId: profile.id },
    routines: store.routines.map((routine) => ({ ...routine, userId: profile.id })),
    exercises: store.exercises.map((exercise) => (exercise.userId ? { ...exercise, userId: profile.id } : exercise)),
    sessions: store.sessions.map((session) => ({ ...session, userId: profile.id })),
    personalRecords: store.personalRecords.map((record) => ({ ...record, userId: profile.id })),
  };
}

export function createInitialCloudStore(profile: UserProfile) {
  return normalizeCloudStore(createSeedStore(profile), profile);
}
