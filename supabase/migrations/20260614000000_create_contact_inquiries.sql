create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  preferred_contact_method text,
  shipment_type text,
  origin_city text,
  origin_country text,
  destination_city text,
  destination_country text,
  service_required text,
  approximate_weight numeric check (approximate_weight is null or approximate_weight > 0),
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'new'
);

alter table public.contact_inquiries enable row level security;

create policy "Anyone can submit contact inquiries"
  on public.contact_inquiries
  for insert
  to anon
  with check (true);
