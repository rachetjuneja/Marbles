-- Sales OS — Marble Visualiser: Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) for your project.
-- The app also runs with NO Supabase at all (in-memory) for local dev.

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key,
  customer_name   text not null,
  customer_mobile text not null,
  created_at timestamptz default now()
);

create table if not exists upload_tokens (
  token      text primary key,
  project_id uuid,
  kind       text check (kind in ('scene','stone')),
  status     text default 'pending',
  url        text,
  created_at timestamptz default now()
);

create table if not exists renders (
  id          uuid primary key,
  project_id  uuid references projects(id) on delete cascade,
  scene_url   text,
  result_url  text,
  surface     text,
  model       text,
  bookmatch   boolean default false,
  stone       jsonb,
  shortlisted boolean default false,
  created_at  timestamptz default now()
);

create index if not exists renders_project_idx on renders (project_id, created_at desc);

-- Storage: public read is convenient for a demo (the image models fetch these URLs,
-- and the browser displays them). For production, switch to private buckets + signed
-- URLs and add RLS. The server uses the service-role key, which bypasses RLS.
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('renders', 'renders', true)
  on conflict (id) do nothing;
