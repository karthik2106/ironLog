import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon/client";
import { hashToken } from "@/lib/neon/auth";
import { normalizeCloudStore } from "@/lib/neon/store";
import { hasDatabaseConfig } from "@/lib/env";
import type { UserProfile, WorkoutStore } from "@/lib/workout/types";

export async function GET(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (auth instanceof NextResponse) return auth;
  const { sql, profile } = auth;
  const rows = await sql`select store from cloud_workout_stores where user_id = ${profile.id} limit 1`;
  const store = rows[0] ? normalizeCloudStore((rows[0] as { store: WorkoutStore }).store, profile) : null;
  return NextResponse.json({ profile, store });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (auth instanceof NextResponse) return auth;
  const { sql, profile } = auth;
  const body = (await request.json()) as { store?: WorkoutStore };
  if (!body.store) {
    return NextResponse.json({ error: "Store payload is required." }, { status: 400 });
  }
  const store = normalizeCloudStore(body.store, profile);
  await sql`
    insert into cloud_workout_stores (user_id, store, updated_at)
    values (${profile.id}, ${JSON.stringify(store)}::jsonb, now())
    on conflict (user_id)
    do update set store = excluded.store, updated_at = now()
  `;
  return NextResponse.json({ ok: true });
}

async function getAuthenticatedProfile(request: Request) {
  if (!hasDatabaseConfig) {
    return NextResponse.json({ error: "Cloud database is not configured." }, { status: 503 });
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }
  const sql = getSql();
  const rows = await sql`
    select u.id, u.email, u.display_name, u.created_at
    from cloud_sessions s
    join cloud_users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)}
      and s.expires_at > now()
    limit 1
  `;
  const row = rows[0] as { id: string; email: string; display_name: string; created_at: string } | undefined;
  if (!row) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }
  const profile: UserProfile = {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: new Date(row.created_at).toISOString(),
  };
  return { sql, profile };
}
