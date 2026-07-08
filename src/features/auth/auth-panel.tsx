"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useApp } from "@/features/auth/app-provider";
import { authSchema } from "@/lib/workout/schemas";

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthPanel() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const { signIn, signUp, useDemoAccount } = useApp();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "demo@ironlog.local", password: "password", displayName: "Karthik" },
  });

  async function onSubmit(values: AuthFormValues) {
    try {
      if (mode === "sign-in") await signIn(values.email, values.password);
      else await signUp(values.email, values.password, values.displayName ?? "Athlete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_0%,rgba(215,255,95,0.14),transparent_34%),#08090b] p-4">
      <Card className="w-full max-w-md animate-fade-up">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Dumbbell className="size-6" />
          </div>
          <CardTitle className="text-2xl">IronLog</CardTitle>
          <CardDescription>Sign in to track Push, Pull, Legs workouts with autosaved sets and progress history.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-300">{errors.email.message}</p>}
            </div>
            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input id="displayName" autoComplete="name" {...register("displayName")} />
                {errors.displayName && <p className="text-xs text-red-300">{errors.displayName.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} {...register("password")} />
              {errors.password && <p className="text-xs text-red-300">{errors.password.message}</p>}
            </div>
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
              {mode === "sign-in" ? "Sign up" : "Sign in"}
            </Button>
            <Button variant="secondary" onClick={useDemoAccount}>
              Demo mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
