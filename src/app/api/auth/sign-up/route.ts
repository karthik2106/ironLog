import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon/client";
import { createSessionToken, hashPassword, hashToken } from "@/lib/neon/auth";
import { createInitialCloudStore } from "@/lib/neon/store";
import { hasDatabaseConfig } from "@/lib/env";
import type { UserProfile } from "@/lib/workout/types";

export async function POST(request: Request) {
  if (!hasDatabaseConfig) {
    return NextResponse.json({ error: "Cloud database is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string; displayName?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = body.displayName?.trim() || "Athlete";

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "Email and a 6 character password are required." }, { status: 400 });
  }

  const sql = getSql();
  const { salt, hash } = hashPassword(password);

  try {
    const users = await sql`
      insert into cloud_users (email, display_name, password_salt, password_hash)
      values (${email}, ${displayName}, ${salt}, ${hash})
      returning id, email, display_name, created_at
    `;
    const row = users[0] as { id: string; email: string; display_name: string; created_at: string };
    const profile: UserProfile = {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: new Date(row.created_at).toISOString(),
    };
    const store = createInitialCloudStore(profile);
    const token = createSessionToken();
    await sql`insert into cloud_sessions (token_hash, user_id, expires_at) values (${hashToken(token)}, ${profile.id}, now() + interval '30 days')`;
    await sql`insert into cloud_workout_stores (user_id, store) values (${profile.id}, ${JSON.stringify(store)}::jsonb)`;

    return NextResponse.json({ profile, store, token });
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate")) {
      return NextResponse.json({ error: "An account already exists for that email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
