alter table public.shipments
  add column if not exists delivery_date date,
  add column if not exists delivery_time time without time zone;

comment on column public.shipments.delivery_date is
  'Calendar date on which a delivered shipment was delivered.';

comment on column public.shipments.delivery_time is
  'Local time at which a delivered shipment was delivered.';
