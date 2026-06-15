alter table public.tracking_events
  alter column event_title drop not null,
  alter column event_description drop not null,
  alter column location_city drop not null,
  alter column location_country drop not null,
  alter column event_time drop not null;
