create table if not exists public.owner_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone_e164 text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_identity_present check (email is not null or phone_e164 is not null)
);

create table if not exists public.owner_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owner_accounts(id) on delete cascade,
  method text not null check (method in ('phone','email')),
  destination text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists owner_otp_lookup_idx
  on public.owner_otp_challenges(owner_id, method, created_at desc);

create table if not exists public.owner_audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid references public.owner_accounts(id) on delete set null,
  event_type text not null,
  method text,
  success boolean not null,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

alter table public.owner_accounts enable row level security;
alter table public.owner_otp_challenges enable row level security;
alter table public.owner_audit_logs enable row level security;

-- No client-facing policies: owner authentication is server-side only.
