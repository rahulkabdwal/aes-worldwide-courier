alter table public.shipments
  add column if not exists receiver_name text;

comment on column public.shipments.receiver_name is
  'Optional name of the person who received the shipment.';
