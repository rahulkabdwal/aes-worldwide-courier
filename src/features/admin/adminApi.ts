import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseTypes";

export const SHIPMENTS_PAGE_SIZE = 10;
export const SHIPMENT_STATUS_OPTIONS = [
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delayed",
] as const;

export const SERVICE_MODE_OPTIONS = [
  "Air",
  "Road",
  "Rail",
  "Express Worldwide",
] as const;

export const NETWORK_CARRIER_OPTIONS = [
  "None",
  "DHL",
  "FedEx",
] as const;

export type ShipmentSortOrder = "newest" | "oldest";
export type ShipmentStatusFilter = "all" | (typeof SHIPMENT_STATUS_OPTIONS)[number];

export type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
export type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
export type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

export type TrackingEvent = Database["public"]["Tables"]["tracking_events"]["Row"];
export type TrackingEventInsert =
  Database["public"]["Tables"]["tracking_events"]["Insert"];
export type TrackingEventUpdate =
  Database["public"]["Tables"]["tracking_events"]["Update"];

type ShipmentStats = {
  total: number;
  inTransit: number;
  delivered: number;
};

type ListShipmentsResult = {
  shipments: Shipment[];
  total: number;
};

type CreateShipmentWithTrackingEventResult = {
  shipment: Shipment;
  trackingEvent: TrackingEvent;
};

export async function adminSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function adminSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

type ListShipmentsOptions = {
  pageSize?: number;
  searchQuery?: string;
  statusFilter?: ShipmentStatusFilter;
  sortOrder?: ShipmentSortOrder;
};

export async function listShipments(
  page: number,
  {
    pageSize = SHIPMENTS_PAGE_SIZE,
    searchQuery,
    statusFilter = "all",
    sortOrder = "newest",
  }: ListShipmentsOptions = {},
): Promise<ListShipmentsResult> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("shipments").select("*", { count: "exact" });

  if (searchQuery?.trim()) {
    const term = searchQuery.trim().replaceAll(",", " ");
    query = query.or(
      [
        `tracking_id.ilike.%${term}%`,
        `status.ilike.%${term}%`,
        `origin_city.ilike.%${term}%`,
        `origin_country.ilike.%${term}%`,
        `destination_city.ilike.%${term}%`,
        `destination_country.ilike.%${term}%`,
        `consignor_name.ilike.%${term}%`,
        `consignee_name.ilike.%${term}%`,
      ].join(","),
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: sortOrder === "oldest" })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    shipments: (data ?? []) as Shipment[],
    total: count ?? 0,
  };
}

export async function getShipmentStats(): Promise<ShipmentStats> {
  const [totalRes, inTransitRes, deliveredRes] = await Promise.all([
    supabase.from("shipments").select("*", { count: "exact", head: true }),
    supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .ilike("status", "%transit%"),
    supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .ilike("status", "%deliver%"),
  ]);

  if (totalRes.error) {
    throw new Error(totalRes.error.message);
  }

  if (inTransitRes.error) {
    throw new Error(inTransitRes.error.message);
  }

  if (deliveredRes.error) {
    throw new Error(deliveredRes.error.message);
  }

  return {
    total: totalRes.count ?? 0,
    inTransit: inTransitRes.count ?? 0,
    delivered: deliveredRes.count ?? 0,
  };
}

export async function createShipment(payload: ShipmentInsert): Promise<Shipment> {
  const { data, error } = await supabase
    .from("shipments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Shipment;
}

export async function createShipmentWithTrackingEvent(
  shipmentPayload: ShipmentInsert,
  trackingEventPayload: Omit<TrackingEventInsert, "shipment_id">,
): Promise<CreateShipmentWithTrackingEventResult> {
  const shipment = await createShipment(shipmentPayload);

  const { data: trackingEvent, error: trackingError } = await supabase
    .from("tracking_events")
    .insert({
      ...trackingEventPayload,
      shipment_id: shipment.id,
    })
    .select("*")
    .single();

  if (trackingError) {
    const { error: rollbackError } = await supabase
      .from("shipments")
      .delete()
      .eq("id", shipment.id);

    if (rollbackError) {
      throw new Error(
        `${trackingError.message} The shipment was created, but the initial tracking event failed and rollback also failed: ${rollbackError.message}`,
      );
    }

    throw new Error(trackingError.message);
  }

  return { shipment, trackingEvent: trackingEvent as TrackingEvent };
}

export async function getShipmentById(shipmentId: string): Promise<Shipment> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", shipmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Shipment not found.");
  }

  return data as Shipment;
}

export async function updateShipment(
  shipmentId: string,
  payload: ShipmentUpdate,
): Promise<Shipment> {
  const { error } = await supabase
    .from("shipments")
    .update(payload)
    .eq("id", shipmentId);

  if (error) {
    throw new Error(error.message);
  }

  return getShipmentById(shipmentId);
}

export async function deleteShipment(shipmentId: string) {
  const { error: deleteEventsError } = await supabase
    .from("tracking_events")
    .delete()
    .eq("shipment_id", shipmentId);

  if (deleteEventsError) {
    throw new Error(deleteEventsError.message);
  }

  const { error } = await supabase.from("shipments").delete().eq("id", shipmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listTrackingEvents(
  shipmentId: string,
): Promise<TrackingEvent[]> {
  const { data, error } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("event_time", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TrackingEvent[];
}

export async function createTrackingEvent(
  payload: TrackingEventInsert,
): Promise<TrackingEvent> {
  const { data, error } = await supabase
    .from("tracking_events")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TrackingEvent;
}

export async function updateTrackingEvent(
  eventId: string,
  payload: TrackingEventUpdate,
): Promise<TrackingEvent> {
  const { data, error } = await supabase
    .from("tracking_events")
    .update(payload)
    .eq("id", eventId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Tracking event was not updated. Verify Supabase RLS UPDATE policy for tracking_events.",
    );
  }

  return data as TrackingEvent;
}

export async function deleteTrackingEvent(eventId: string) {
  const { error } = await supabase.from("tracking_events").delete().eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}
