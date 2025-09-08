# Customer Needs

Full-stack (Supabase + React/Vite) personal ledger for customer transactions & payments.

## Tech Stack

- Vite + React + TypeScript
- TanStack Router
- React Hook Form + Zod
- TailwindCSS
- Supabase (Auth & Postgres)

## Local Setup

1. Copy environment file:

```bash
cp web/.env.example web/.env
```

2. Create a Supabase project and set `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` in `web/.env`.
3. Apply SQL below in the Supabase SQL editor.
4. Install & run:

```bash
cd web
npm install
npm run dev
```

## Database Schema (SQL)

```sql
-- Auth handled by Supabase (auth.users)

create table if not exists public.customers (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	name text not null,
	phone text,
	created_at timestamptz default now()
);
create index if not exists customers_user_id_idx on public.customers(user_id);

create type transaction_type as enum (
	'phoneline_charging',
	'phoneline_payment',
	'shahid_subscription',
	'netflix_subscription'
);

create table if not exists public.transactions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	customer_id uuid references public.customers(id) on delete cascade not null,
	title text not null,
	description text,
	type transaction_type not null,
	amount numeric(12,2) not null check (amount >= 0),
	payment_method text check (payment_method in ('whish','cash')),
	created_at timestamptz default now()
);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_customer_id_idx on public.transactions(customer_id);

create table if not exists public.payments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	transaction_id uuid references public.transactions(id) on delete cascade not null,
	amount numeric(12,2) not null check (amount > 0),
	method text check (method in ('whish','cash')),
	note text,
	created_at timestamptz default now()
);
create index if not exists payments_transaction_id_idx on public.payments(transaction_id);

-- RLS Policies
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.payments enable row level security;

create policy "Customers access" on public.customers
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Transactions access" on public.transactions
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Payments access" on public.payments
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper view: customer balances
create or replace view public.customer_balances as
select c.id as customer_id,
			 c.user_id,
			 sum(t.amount) - coalesce(sum(p.amount) filter (where p.id is not null),0) as outstanding
from customers c
left join transactions t on t.customer_id = c.id
left join payments p on p.transaction_id = t.id
group by c.id;
```

## Roadmap

- Auth pages (sign in/up)
- Customer CRUD + import from contacts (PWA + Web Share Target / Contact Picker API where supported)
- Transactions CRUD with pagination & filters
- Payments (installments) UI & inline creation
- Balance calculations + summary widgets
- Offline caching (later) using IndexedDB & background sync

## License

MIT
