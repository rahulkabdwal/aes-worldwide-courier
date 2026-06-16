import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseTypes";
import { getNetworkTrackingUrl } from "@/lib/tracking-urls";

type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
type TrackingEvent = Database["public"]["Tables"]["tracking_events"]["Row"];
type VisibleTrackingEvent = TrackingEvent & { event_title: string };

type TrackCourierTrackingEvent = {
  status?: string;
  description?: string;
  message?: string;
  location?: string;
  city?: string;
  timestamp?: string;
  date?: string;
  time?: string;
  event_time?: string;
};

const apiCarriers = new Set(["blue dart", "dtdc", "speed post", "delhivery"]);
const forwardingLinkCarriers = new Set(["dhl", "fedex", "ups", "aramex"]);

function normalizeCarrier(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function isApiCarrier(value: string | null) {
  const carrier = normalizeCarrier(value);

  return carrier.length > 0 && carrier !== "none" && apiCarriers.has(carrier);
}

function isForwardingLinkCarrier(value: string | null) {
  const carrier = normalizeCarrier(value);

  return carrier.length > 0 && carrier !== "none" && forwardingLinkCarriers.has(carrier);
}

function getTrackCourierEvents(response: unknown): TrackCourierTrackingEvent[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const record = response as Record<string, unknown>;
  const possibleEventArrays = [
    record.events,
    record.tracking,
    record.trackingEvents,
    record.checkpoints,
    record.history,
    record.data,
  ];

  for (const value of possibleEventArrays) {
    if (Array.isArray(value)) {
      return value as TrackCourierTrackingEvent[];
    }

    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const nestedArrays = [
        nested.events,
        nested.tracking,
        nested.trackingEvents,
        nested.checkpoints,
        nested.history,
      ];

      const nestedEvents = nestedArrays.find(Array.isArray);
      if (nestedEvents) {
        return nestedEvents as TrackCourierTrackingEvent[];
      }
    }
  }

  return [];
}

function mapTrackCourierEvents(
  response: unknown,
  shipmentData: Shipment,
): TrackingEvent[] {
  return getTrackCourierEvents(response)
    .map((event, index) => {
      const eventTime = event.timestamp ?? event.event_time ?? event.date ?? event.time ?? null;
      const eventTitle =
        event.description ?? event.status ?? event.message ?? "Shipment update";

      return {
        id: `trackcourier-${shipmentData.id}-${index}`,
        shipment_id: shipmentData.id,
        event_title: eventTitle,
        event_description: event.description ?? event.message ?? event.status ?? null,
        location_city: event.location ?? event.city ?? null,
        location_country: null,
        event_time: eventTime,
        created_at: eventTime ?? new Date().toISOString(),
      };
    })
    .filter((event) => Boolean(event.event_title?.trim()));
}

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatOptionalDate(value: string | null) {
  if (!value) return "Pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLocation(city: string | null) {
  return city?.trim() || "N/A";
}

function hasEventTitle(event: TrackingEvent): event is VisibleTrackingEvent {
  return Boolean(event.event_title?.trim());
}

export default function Tracking() {
  const [trackingId, setTrackingId] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const networkCarrier = shipment?.network_carrier?.trim() ?? "";
  const networkTrackingId = shipment?.network_tracking_id?.trim() ?? "";
  const hasNetworkTracking =
    networkCarrier !== "None" && networkCarrier.length > 0 && networkTrackingId.length > 0;
  const networkTrackingUrl =
    hasNetworkTracking
      ? getNetworkTrackingUrl(networkCarrier, networkTrackingId)
      : "";
  const visibleEvents = events.filter(hasEventTitle);
  const canShowProofOfDelivery =
    shipment?.status?.trim().toLowerCase() === "delivered" &&
    Boolean(shipment.pod_url?.trim());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTrackingId = trackingId.trim();
    if (!normalizedTrackingId) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(false);
    setShipment(null);
    setEvents([]);

    try {
      const shipmentQuery = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_id", normalizedTrackingId)
        .maybeSingle();

      const shipmentData = shipmentQuery.data as Shipment | null;
      const shipmentError = shipmentQuery.error;

      if (shipmentError) {
        throw new Error(shipmentError.message);
      }

      if (!shipmentData) {
        setError("Shipment not found.");
        return;
      }

      const loadSupabaseEvents = async () => {
        const eventsQuery = await supabase
          .from("tracking_events")
          .select("*")
          .eq("shipment_id", shipmentData.id)
          .order("event_time", { ascending: false });

        const eventsData = (eventsQuery.data ?? []) as TrackingEvent[];
        const eventsError = eventsQuery.error;

        if (eventsError) {
          throw new Error(eventsError.message);
        }

        return eventsData;
      };

      const networkCarrier = shipmentData.network_carrier?.trim() ?? "";
      const networkTrackingId = shipmentData.network_tracking_id?.trim() ?? "";
      const hasNetworkCarrierAndTrackingId =
        networkCarrier.length > 0 && networkTrackingId.length > 0;
      const shouldUseTrackCourier =
        hasNetworkCarrierAndTrackingId && isApiCarrier(networkCarrier);
      const shouldForceLocalEvents =
        !hasNetworkCarrierAndTrackingId ||
        normalizeCarrier(networkCarrier) === "none" ||
        isForwardingLinkCarrier(networkCarrier);

      if (shouldUseTrackCourier) {
        try {
          const { data, error: trackCourierError } = await supabase.functions.invoke(
            'track-courier',
            {
              body: {
                trackingNumber: shipmentData.network_tracking_id,
                carrierName: shipmentData.network_carrier,
              },
            },
          );

          if (trackCourierError) {
            throw trackCourierError;
          }

          const mappedEvents = mapTrackCourierEvents(data, shipmentData);

          setShipment(shipmentData);
          setEvents(mappedEvents);
          return;
        } catch {
          // Silently fall back to local tracking events.
        }
      }

      if (shouldForceLocalEvents || !shouldUseTrackCourier) {
        const eventsData = await loadSupabaseEvents();

        setShipment(shipmentData);
        setEvents(eventsData);
        return;
      }

      const eventsData = await loadSupabaseEvents();

      setShipment(shipmentData);
      setEvents(eventsData);
    } catch (searchError) {
      const message =
        searchError instanceof Error
          ? searchError.message
          : "Unable to fetch tracking details.";
      setError(message);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-neutral-50/50">
        <div className="bg-white border-b border-neutral-200 py-8 md:py-12 px-4 md:px-6 shadow-sm relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5 md:space-y-6">
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
              Track your shipment
            </h1>
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Enter tracking number"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-10 md:pl-12 pr-24 md:pr-28 py-3.5 md:py-4 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all font-mono text-sm md:text-lg shadow-sm placeholder:text-sm md:placeholder:text-lg"
              />
              <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
              <button
                type="submit"
                disabled={!trackingId.trim() || isSearching}
                className="absolute right-2 top-2 bottom-2 bg-black text-white px-4 md:px-6 rounded-lg font-medium text-xs md:text-sm hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {isSearching ? "Locating..." : "Track"}
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {error ? (
            <div className="text-center text-red-500 py-8 md:py-10 font-medium text-sm md:text-base">{error}</div>
          ) : null}

          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center text-center py-14 md:py-20 text-neutral-400 opacity-50">
              <MapPin className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 stroke-1" />
              <p className="text-sm md:text-base max-w-xs">Enter a tracking number to view shipment progress.</p>
            </div>
          ) : !shipment ? (
            <div className="flex flex-col items-center justify-center text-center py-14 md:py-20 text-neutral-400">
              <MapPin className="w-9 h-9 md:w-10 md:h-10 mb-3 stroke-1" />
              <p className="text-sm md:text-base">No shipment details to display.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white rounded-2xl p-5 md:p-8 border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-start gap-4 mb-6 md:mb-8">
                    <div>
                      <div className="text-xs md:text-sm text-neutral-500 font-mono mb-1">
                        TRACKING ID
                      </div>
                      <div className="text-xl md:text-2xl font-mono font-bold tracking-tight">
                        {shipment.tracking_id ?? "N/A"}
                      </div>
                    </div>
                    <div className="px-2.5 md:px-3 py-1 bg-green-50 text-green-700 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full border border-green-100 flex items-center gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      {shipment.status ?? "Unknown"}
                    </div>
                  </div>

                  {hasNetworkTracking && networkTrackingUrl !== "#" ? (
                    <div className="mb-6 md:mb-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs md:text-sm text-blue-900">
                      <span className="font-semibold">
                        Forwarded via {networkCarrier}:{" "}
                      </span>
                      <a
                        href={networkTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold underline underline-offset-4 hover:text-blue-700"
                      >
                        {networkTrackingId}
                      </a>
                    </div>
                  ) : null}

                  {canShowProofOfDelivery ? (
                    <div className="mb-6 md:mb-8 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm md:text-base">
                      <a
                        href={shipment.pod_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-semibold text-green-900 hover:text-green-700 transition-colors"
                      >
                        <span>📄</span>
                        <span>View Proof of Delivery</span>
                      </a>
                    </div>
                  ) : null}

                  <div className="relative h-2 bg-neutral-100 rounded-full mb-6 md:mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[65%] bg-black rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Consignor
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {shipment.consignor_name ?? "N/A"}
                      </span>
                    </div>
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Consignee
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {shipment.consignee_name ?? "N/A"}
                      </span>
                    </div>
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Booking Date
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {formatDate(shipment.booking_date)}
                      </span>
                    </div>
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Total Pieces
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {shipment.pieces == null ? "N/A" : shipment.pieces}
                      </span>
                    </div>
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Total Weight
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {shipment.weight == null ? "N/A" : `${shipment.weight} kg`}
                      </span>
                    </div>
                    <div className="border border-neutral-100 rounded-lg p-3 md:p-4">
                      <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                        Route
                      </span>
                      <span className="font-semibold text-sm md:text-base text-neutral-900">
                        {shipment.origin_city ?? "N/A"}
                        <span className="px-1 text-neutral-400">to</span>
                        {shipment.destination_city ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  {visibleEvents.length > 0 ? (
                    <div className="space-y-6 md:space-y-8 relative pl-4 border-l-2 border-neutral-100 ml-3">
                      {visibleEvents.map((event) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm"></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div>
                              <h4 className="font-medium text-base md:text-lg">
                                {event.event_title}
                              </h4>
                              <p className="text-sm md:text-base text-neutral-500">
                                {formatLocation(event.location_city)}
                              </p>
                            </div>
                            <div className="text-left sm:text-right text-xs md:text-sm text-neutral-400 mt-1 sm:mt-0">
                              <div className="font-mono">
                                {formatDate(event.event_time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="bg-white rounded-xl p-5 md:p-6 border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 justify-between text-sm">
                  <div>
                    <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                      Estimated Delivery
                    </span>
                    <span className="font-semibold text-base md:text-lg">
                      {formatOptionalDate(shipment.estimated_delivery)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-neutral-400 text-xs uppercase tracking-wide mb-1">
                      Service Mode
                    </span>
                    <span className="font-semibold text-base md:text-lg capitalize">
                      {shipment.service_mode ?? "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
