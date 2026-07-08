import { describe, expect, it } from "vitest";
import {
  convertWeight,
  createWorkoutFromRoutine,
  estimatedOneRepMax,
  finishWorkout,
  recordsBelongToOnlyUser,
  saveSet,
  summarizeWorkout,
} from "./engine";
import { createSeedStore } from "./seed";

describe("workout engine", () => {
  it("creates a workout from an editable routine", () => {
    const store = createSeedStore();
    const next = createWorkoutFromRoutine(store, "routine-push", "2026-07-07T10:00:00.000Z");
    const session = next.sessions[0];
    expect(session.status).toBe("active");
    expect(session.exercises).toHaveLength(5);
    expect(session.exercises[0].sets).toHaveLength(2);
    expect(session.exercises[0].exerciseNameSnapshot).toBe("Incline dumbbell press");
  });

  it("saves completed sets and detects personal records", () => {
    let store = createWorkoutFromRoutine(createSeedStore(), "routine-push", "2026-07-07T10:00:00.000Z");
    const session = store.sessions[0];
    const set = session.exercises[0].sets[0];
    store = saveSet(store, session.id, set.id, {
      weight: 30,
      reps: 9,
      rir: 1,
      completedAt: "2026-07-07T10:05:00.000Z",
    });
    expect(store.sessions[0].exercises[0].sets[0].completedAt).toBeTruthy();
    expect(store.personalRecords.length).toBeGreaterThan(0);
  });

  it("restores unfinished workouts from state", () => {
    const store = createWorkoutFromRoutine(createSeedStore(), "routine-pull");
    expect(store.sessions.find((session) => session.status === "active")?.routineNameSnapshot).toBe("Pull");
  });

  it("completes a workout and summarizes it", () => {
    let store = createWorkoutFromRoutine(createSeedStore(), "routine-legs", "2026-07-07T10:00:00.000Z");
    const session = store.sessions[0];
    const set = session.exercises[0].sets[0];
    store = saveSet(store, session.id, set.id, { weight: 120, reps: 8, completedAt: "2026-07-07T10:10:00.000Z" });
    store = finishWorkout(store, session.id, "Solid", 5, "2026-07-07T11:00:00.000Z");
    const summary = summarizeWorkout(store, store.sessions[0]);
    expect(store.sessions[0].status).toBe("completed");
    expect(summary.completedSets).toBe(1);
    expect(summary.totalVolume).toBe(960);
  });

  it("converts units", () => {
    expect(convertWeight(100, "kg", "lb")).toBe(220.5);
    expect(convertWeight(220.5, "lb", "kg")).toBe(100);
  });

  it("uses the documented e1RM formula", () => {
    expect(estimatedOneRepMax(100, 6)).toBe(120);
  });

  it("keeps user-owned records isolated", () => {
    const store = createSeedStore();
    expect(recordsBelongToOnlyUser(store, store.profile.id)).toBe(true);
  });
});
