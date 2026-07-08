import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Use at least 6 characters."),
  displayName: z.string().min(2, "Enter your name.").optional(),
});

export const routineExerciseSchema = z.object({
  targetSets: z.coerce.number().int().min(1).max(12),
  minReps: z.coerce.number().int().min(1).max(100),
  maxReps: z.coerce.number().int().min(1).max(100),
  targetRir: z.coerce.number().min(0).max(10).nullable().optional(),
  notes: z.string().max(500).optional(),
}).refine((value) => value.maxReps >= value.minReps, {
  message: "Maximum reps must be at least minimum reps.",
  path: ["maxReps"],
});

export const exerciseSchema = z.object({
  name: z.string().min(2).max(80),
  primaryMuscle: z.string().min(2),
  equipment: z.string().min(2).max(80),
  category: z.enum(["compound", "isolation", "bodyweight", "machine"]),
  instructions: z.string().min(6).max(800),
  notes: z.string().max(800).optional(),
});
