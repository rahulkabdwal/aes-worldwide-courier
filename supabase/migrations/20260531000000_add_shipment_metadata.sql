alter table public.shipments
  add column if not exists booking_date timestamp with time zone,
  add column if not exists pieces integer,
  add column if not exists consignor_name text,
  add column if not exists consignee_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_pieces_non_negative'
  ) then
    alter table public.shipments
      add constraint shipments_pieces_non_negative
      check (pieces is null or pieces >= 0);
  end if;
end $$;
