alter table public.contact_inquiries
  add column if not exists phone text,
  add column if not exists preferred_contact_method text,
  add column if not exists shipment_type text,
  add column if not exists origin_city text,
  add column if not exists origin_country text,
  add column if not exists destination_city text,
  add column if not exists destination_country text,
  add column if not exists service_required text,
  add column if not exists approximate_weight numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contact_inquiries_approximate_weight_positive'
  ) then
    alter table public.contact_inquiries
      add constraint contact_inquiries_approximate_weight_positive
      check (approximate_weight is null or approximate_weight > 0);
  end if;
end $$;
