alter table public.shipments
  add column if not exists network_carrier text,
  add column if not exists network_tracking_id text;
