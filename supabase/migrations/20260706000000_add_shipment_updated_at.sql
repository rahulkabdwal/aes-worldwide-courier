alter table public.shipments
  add column if not exists updated_at timestamp with time zone;

update public.shipments
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.shipments
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.set_shipments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shipments_updated_at on public.shipments;

create trigger set_shipments_updated_at
before update on public.shipments
for each row
execute function public.set_shipments_updated_at();

comment on column public.shipments.updated_at is
  'Timestamp of the most recent admin update to this shipment.';
