create table if not exists public.agent_preferences (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
