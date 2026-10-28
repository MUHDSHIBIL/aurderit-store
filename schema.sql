-- Aurderit product catalogue schema for Supabase.
-- IMPORTANT: replace admin@example.com below with the exact email used for your admin account.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'Other',
  sku text,
  image_url text not null,
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
on public.products for select
to anon, authenticated
using (is_active = true or (auth.jwt() ->> 'email') = 'admin@example.com');

drop policy if exists "Admin can add products" on public.products;
create policy "Admin can add products"
on public.products for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'admin@example.com');

drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products"
on public.products for update
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@example.com')
with check ((auth.jwt() ->> 'email') = 'admin@example.com');

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
on public.products for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@example.com');

create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
