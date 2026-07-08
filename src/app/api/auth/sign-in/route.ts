import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon/client";
import { createSessionToken, hashToken, verifyPassword } from "@/lib/neon/auth";
import { createInitialCloudStore, normalizeCloudStore } from "@/lib/neon/store";
import { hasDatabaseConfig } from "@/lib/env";
import type { UserProfile, WorkoutStore } from "@/lib/workout/types";

export async function POST(request: Request) {
  if (!hasDatabaseConfig) {
    return NextResponse.json({ error: "Cloud database is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const sql = getSql();
  const users = await sql`
    select id, email, display_name, password_salt, password_hash, created_at
    from cloud_users
    where email = ${email}
    limit 1
  `;
  const row = users[0] as
    | { id: string; email: string; display_name: string; password_salt: string; password_hash: string; created_at: string }
    | undefined;

  if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const profile: UserProfile = {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: new Date(row.created_at).toISOString(),
  };

  const existing = await sql`select store from cloud_workout_stores where user_id = ${profile.id} limit 1`;
  const store = existing[0]
    ? normalizeCloudStore((existing[0] as { store: WorkoutStore }).store, profile)
    : createInitialCloudStore(profile);

  if (!existing[0]) {
    await sql`insert into cloud_workout_stores (user_id, store) values (${profile.id}, ${JSON.stringify(store)}::jsonb)`;
  }

  const token = createSessionToken();
  await sql`insert into cloud_sessions (token_hash, user_id, expires_at) values (${hashToken(token)}, ${profile.id}, now() + interval '30 days')`;

  return NextResponse.json({ profile, store, token });
}
