# Backend/Secrets Setup (No Exposed API Keys)

## Current state
- Frontend uses only public env values from `.env.local`.
- Gemini key is removed from frontend env.
- Extraction runs through Supabase Edge Function `extract-interview`.
- Server-side secret is stored in `supabase/functions/.env.local` for local function serving.

## 1) SQL setup (run in Supabase SQL Editor)
```sql
create extension if not exists pgcrypto;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  role text not null,
  category text not null default 'Software'
    check (category in ('Software', 'Core ECE', 'Management')),
  questions jsonb not null default '[]'::jsonb,
  raw_dump text,
  created_at timestamptz not null default now()
);

create index if not exists interviews_created_at_idx
  on public.interviews (created_at desc);

alter table public.interviews enable row level security;

drop policy if exists "Anyone can view interviews" on public.interviews;
drop policy if exists "Verified users can insert interviews" on public.interviews;
drop policy if exists "Authenticated users can insert interviews" on public.interviews;

create policy "Anyone can view interviews"
on public.interviews
for select
using (true);

create policy "Verified users can insert interviews"
on public.interviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and coalesce((auth.jwt() ->> 'email'), '') ilike '%@vce.ac.in'
);
```

## 2) Auth settings (Supabase dashboard)
- Authentication -> Providers -> Email
- Enable OTP code sign in (6-digit code)

## 3) Edge function secrets + deploy
Run these in project root after Supabase login:
```powershell
npx supabase login
npx supabase link --project-ref tjyuxnroaqfzpjusowif
npx supabase secrets set GEMINI_API_KEY="<your-gemini-key>"
npx supabase functions deploy extract-interview
```

## 4) Local run
```powershell
npm run dev
```

If testing function locally, use:
```powershell
npx supabase functions serve extract-interview --env-file supabase/functions/.env.local
```
