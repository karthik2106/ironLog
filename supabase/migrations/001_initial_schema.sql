create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'Athlete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  category text not null,
  instructions text not null,
  notes text,
  is_custom boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null default 'Custom',
  scheduled_days int[] not null default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  exercise_name_snapshot text not null,
  sort_order int not null default 0,
  target_sets int not null,
  min_reps int not null,
  max_reps int not null,
  target_rir numeric,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id),
  routine_name_snapshot text not null,
  status text not null check (status in ('active', 'completed')),
  unit text not null check (unit in ('kg', 'lb')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds int,
  notes text,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  exercise_name_snapshot text not null,
  primary_muscle_snapshot text not null,
  routine_exercise_id uuid,
  sort_order int not null default 0,
  target_rir numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number int not null,
  target_min_reps int not null,
  target_max_reps int not null,
  weight numeric,
  reps int,
  rir numeric,
  completed_at timestamptz,
  previous_weight numeric,
  previous_reps int,
  is_personal_record boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  exercise_name_snapshot text not null,
  type text not null check (type in ('weight', 'reps', 'estimated_1rm', 'volume')),
  value numeric not null,
  unit text not null check (unit in ('kg', 'lb')),
  achieved_at timestamptz not null,
  workout_set_id uuid not null references public.workout_sets(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  unit text not null default 'kg' check (unit in ('kg', 'lb')),
  default_rest_seconds int not null default 90,
  auto_start_rest_timer boolean not null default true,
  week_start_day int not null default 1,
  theme text not null default 'dark',
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.personal_records enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles own rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "exercise library and own custom exercises" on public.exercises for select using (user_id is null or auth.uid() = user_id);
create policy "custom exercises own writes" on public.exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines own rows" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routine exercise via owning routine" on public.routine_exercises for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));
create policy "sessions own rows" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout exercise via owning session" on public.workout_exercises for all
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "workout sets via owning session" on public.workout_sets for all
  using (exists (
    select 1 from public.workout_exercises we
    join public.workout_sessions s on s.id = we.session_id
    where we.id = workout_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workout_sessions s on s.id = we.session_id
    where we.id = workout_exercise_id and s.user_id = auth.uid()
  ));
create policy "personal records own rows" on public.personal_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings own rows" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
