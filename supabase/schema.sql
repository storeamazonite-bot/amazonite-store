create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Electronics',
  price numeric(12,2) not null default 0 check (price >= 0),
  rating numeric(3,2) check (rating is null or (rating >= 0 and rating <= 5)),
  badge text,
  image text,
  affiliate_url text not null,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (status = 'active');

-- All writes are intentionally performed by the protected Vercel server using
-- the Supabase service-role key after checking the OWNER role server-side.
-- Do not add a client-side write policy here.
