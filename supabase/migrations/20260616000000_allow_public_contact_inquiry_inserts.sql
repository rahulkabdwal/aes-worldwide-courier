alter table public.contact_inquiries enable row level security;

drop policy if exists "Anyone can submit contact inquiries"
  on public.contact_inquiries;

drop policy if exists "Public can submit contact inquiries"
  on public.contact_inquiries;

create policy "Public can submit contact inquiries"
  on public.contact_inquiries
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.contact_inquiries to anon, authenticated;
