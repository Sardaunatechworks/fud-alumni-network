-- ============================================================
-- FUD Alumni Mentorship Network — Supabase Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (mirrors auth.users, one row per user)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text        not null,
  email         text        not null,
  role          text        check (role in ('student','alumni','admin')) not null,
  status        text        check (status in ('active','pending','rejected')) not null default 'active',
  department    text,
  faculty       text,
  graduation_year text,
  expertise     text,
  bio           text,
  level         text,
  interests     text[],
  avatar_url    text,
  created_at    timestamptz default now()
);

-- Auto-insert a profile row whenever auth.users gets a new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'role',
    coalesce(new.raw_user_meta_data->>'status', 'active')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. MENTORSHIP REQUESTS
create table if not exists public.mentorship_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid references public.profiles(id) on delete cascade,
  alumni_id     uuid references public.profiles(id) on delete cascade,
  reason        text,
  status        text check (status in ('pending','accepted','declined')) not null default 'pending',
  created_at    timestamptz default now()
);

-- 3. CHATS
create table if not exists public.chats (
  id                text primary key,  -- "{student_id}_{alumni_id}"
  student_id        uuid references public.profiles(id) on delete cascade,
  alumni_id         uuid references public.profiles(id) on delete cascade,
  last_message      text default '',
  last_time         text default '',
  unread_by_student int  default 0,
  unread_by_alumni  int  default 0,
  created_at        timestamptz default now()
);

-- 4. MESSAGES
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     text references public.chats(id) on delete cascade,
  text        text not null,
  sender      text check (sender in ('student','alumni')) not null,
  sender_id   uuid references public.profiles(id) on delete set null,
  status      text default 'sent',
  created_at  timestamptz default now()
);

-- 5. NOTIFICATIONS
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  category    text check (category in ('request','message','session','system')) not null,
  title       text not null,
  body        text not null,
  read        boolean default false,
  related_id  text,
  created_at  timestamptz default now()
);

-- 6. SESSIONS
create table if not exists public.sessions (
  id           text primary key,
  mentor       text,
  mentee       text,
  scheduled_at timestamptz,
  status       text check (status in ('Completed','Scheduled')) not null default 'Scheduled',
  duration     text default '-',
  created_at   timestamptz default now()
);

-- 7. REPORTS
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_id uuid references public.profiles(id) on delete set null,
  reason      text,
  severity    text check (severity in ('Low','Medium','High')) not null default 'Low',
  created_at  timestamptz default now()
);

-- 8. ADMIN CONFIG (single row)
create table if not exists public.admin_config (
  id                int  primary key default 1,
  auto_approval     boolean not null default false,
  maintenance_mode  boolean not null default false
);
insert into public.admin_config (id, auto_approval, maintenance_mode)
  values (1, false, false)
  on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles             enable row level security;
alter table public.mentorship_requests  enable row level security;
alter table public.chats                enable row level security;
alter table public.messages             enable row level security;
alter table public.notifications        enable row level security;
alter table public.sessions             enable row level security;
alter table public.reports              enable row level security;
alter table public.admin_config         enable row level security;

-- PROFILES: users can read all profiles (for finding mentors), update only their own
create policy "profiles: public read"  on public.profiles for select using (true);
create policy "profiles: self update"  on public.profiles for update using (auth.uid() = id);
create policy "profiles: admin all"    on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- MENTORSHIP REQUESTS: student or alumni in the request can read; student creates
create policy "requests: participants read" on public.mentorship_requests for select using (
  auth.uid() = student_id or auth.uid() = alumni_id or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "requests: student insert" on public.mentorship_requests for insert with check (auth.uid() = student_id);
create policy "requests: alumni/admin update" on public.mentorship_requests for update using (
  auth.uid() = alumni_id or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- CHATS: only participants can read/write
create policy "chats: participants" on public.chats for all using (
  auth.uid() = student_id or auth.uid() = alumni_id or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- MESSAGES: only participants of the parent chat
create policy "messages: participants" on public.messages for all using (
  exists (
    select 1 from public.chats c
    where c.id = public.messages.chat_id and (auth.uid() = c.student_id or auth.uid() = c.alumni_id)
  ) or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- NOTIFICATIONS: only the target user
create policy "notifications: own" on public.notifications for all using (auth.uid() = user_id);

-- SESSIONS: admin manages; all authenticated can read
create policy "sessions: read" on public.sessions for select using (auth.role() = 'authenticated');
create policy "sessions: admin write" on public.sessions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- REPORTS: authenticated users can insert; admin can read all
create policy "reports: insert" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports: admin read" on public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ADMIN CONFIG: admin only
create policy "admin_config: admin" on public.admin_config for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- REALTIME: enable for messages and notifications
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- STORAGE: avatars bucket
-- Note: Run these individually if your Supabase version requires
-- ============================================================

-- Create the bucket
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access policies for the avatars bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar."
  on storage.objects for update
  using (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar."
  on storage.objects for delete
  using (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
