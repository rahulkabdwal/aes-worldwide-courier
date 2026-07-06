import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Hash,
  MapPin,
  Navigation,
  Network,
  Package,
  Search,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabaseTypes";
import { getNetworkTrackingUrl } from "@/lib/tracking-urls";

type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
type TrackingEvent = Database["public"]["Tables"]["tracking_events"]["Row"];
type VisibleTrackingEvent = TrackingEvent & { event_title: string };

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(/T00:00:00(?:\.000)?(?:Z|\+00:00)$/.test(value)
      ? { timeZone: "UTC" }
      : {}),
  });
}

function formatLocation(city: string | null) {
  return city?.trim() || "N/A";
}

function formatTime(value: string | null) {
  if (!value) return "N/A";

  if (/^\d{2}:\d{2}/.test(value)) {
    const [hours = "0", minutes = "0"] = value.split(":");
    return new Date(2000, 0, 1, Number(hours), Number(minutes)).toLocaleTimeString(
      "en-US",
      { hour: "numeric", minute: "2-digit" },
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function DetailRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const LabelIcon = Icon ?? Package;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-4 border-b border-neutral-100 py-4 last:border-b-0">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
        <LabelIcon className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
        {label}
      </dt>
      <dd className="break-words text-right text-[15px] font-semibold text-neutral-900">
        {children}
      </dd>
    </div>
  );
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
  const visibleEvents = events.filter(hasEventTitle).sort((a, b) => {
    const bTime = new Date(b.event_time ?? b.created_at).getTime();
    const aTime = new Date(a.event_time ?? a.created_at).getTime();
    return bTime - aTime;
  });
  const latestEvent = visibleEvents[0];
  const hasTrackingProgress = visibleEvents.length > 0 && Boolean(latestEvent);
  const isDelivered = shipment?.status?.trim().toLowerCase() === "delivered";
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

      const eventsQuery = await supabase
        .from("tracking_events")
        .select("*")
        .eq("shipment_id", shipmentData.id)
        .order("event_time", { ascending: false });

      if (eventsQuery.error) {
        throw new Error(eventsQuery.error.message);
      }

      setShipment(shipmentData);
      setEvents((eventsQuery.data ?? []) as TrackingEvent[]);
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
                <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] md:p-8">
                  <div className="mb-5 flex items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        Shipment overview
                      </p>
                      <h2 className="text-lg font-semibold tracking-tight text-neutral-950 md:text-xl">
                        Shipment Details
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider md:text-xs ${
                        isDelivered
                          ? "border-green-100 bg-green-50 text-green-700"
                          : "border-orange-100 bg-orange-50 text-primary-dark"
                      }`}
                    >
                      {shipment.status ?? "Unknown"}
                    </span>
                  </div>

                  {hasNetworkTracking && networkTrackingUrl !== "#" ? (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-xs text-neutral-800 md:mb-8 md:text-sm">
                      <Network className="size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <span className="font-semibold">Forwarded via {networkCarrier}: </span>
                        <a
                          href={networkTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-primary-dark underline underline-offset-4"
                        >
                          {networkTrackingId}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {canShowProofOfDelivery ? (
                    <div className="mb-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm md:mb-8 md:text-base">
                      <a
                        href={shipment.pod_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-semibold text-green-900 hover:text-green-700 transition-colors"
                      >
                        <FileCheck2 className="size-5" aria-hidden="true" />
                        <span>View Proof of Delivery</span>
                      </a>
                    </div>
                  ) : null}

                  <dl>
                    <DetailRow label="Tracking ID" icon={Hash}><span className="font-mono">{shipment.tracking_id ?? "N/A"}</span></DetailRow>
                    <DetailRow label="Booking Date" icon={CalendarDays}>{formatDate(shipment.booking_date)}</DetailRow>
                    <DetailRow label="Origin" icon={MapPin}>{[shipment.origin_city, shipment.origin_country].filter(Boolean).join(", ") || "N/A"}</DetailRow>
                    <DetailRow label="Destination" icon={Navigation}>{[shipment.destination_city, shipment.destination_country].filter(Boolean).join(", ") || "N/A"}</DetailRow>
                    <DetailRow label="Consignor" icon={UserRound}>{shipment.consignor_name ?? "N/A"}</DetailRow>
                    {shipment.consignee_name?.trim() ? (
                      <DetailRow label="Consignee" icon={UserRound}>{shipment.consignee_name}</DetailRow>
                    ) : null}
                    <DetailRow label="Pieces" icon={Package}>{shipment.pieces ?? "N/A"}</DetailRow>
                    <DetailRow label="Service Mode" icon={Truck}>{shipment.service_mode ?? "N/A"}</DetailRow>
                    {hasNetworkTracking ? (
                      <DetailRow label="Forwarded Network" icon={Network}>{`${networkCarrier} · ${networkTrackingId}`}</DetailRow>
                    ) : null}
                  </dl>

                  {isDelivered ? (
                    <div className="mt-7 border-t border-neutral-200 pt-6">
                      <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="font-semibold text-neutral-950">Delivery Information</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Delivered On</p>
                          <p className="mt-1 text-base font-semibold text-neutral-900">{formatDate(shipment.delivery_date)}</p>
                        </div>
                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Delivered At</p>
                          <p className="mt-1 text-base font-semibold text-neutral-900">{formatTime(shipment.delivery_time)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>

                {hasTrackingProgress ? (
                <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] md:p-8">
                  <div className="mb-6 border-b border-neutral-100 pb-5">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Live progress</p>
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-950 md:text-xl">Shipment Status</h2>
                  </div>

                  <div className="mb-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Current Status</p>
                      <p className="mt-2 text-lg font-semibold text-neutral-950">{shipment.status ?? "Unknown"}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Latest Event</p>
                      <p className="mt-2 text-lg font-semibold text-neutral-950">{latestEvent?.event_title ?? "No updates yet"}</p>
                      {latestEvent?.event_description?.trim() ? (
                        <p className="mt-1 text-sm leading-6 text-neutral-500">{latestEvent.event_description}</p>
                      ) : null}
                    </div>
                  </div>

                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Status Timeline</h3>
                  <ol>
                    {visibleEvents.map((event, index) => (
                        <li
                          key={event.id}
                          className="relative animate-in fade-in slide-in-from-bottom-2 fill-mode-both pl-8 pb-7 last:pb-0"
                          style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
                        >
                          {index < visibleEvents.length - 1 ? (
                            <span className="absolute bottom-0 left-[7px] top-3 w-px bg-neutral-200" aria-hidden="true" />
                          ) : null}
                          <span className={`absolute left-0 top-1.5 size-[15px] rounded-full border-[4px] border-white shadow-sm ${index === 0 ? "bg-primary" : "bg-neutral-400"}`} aria-hidden="true" />
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-neutral-900">{event.event_title}</h4>
                              {event.location_city?.trim() ? (
                                <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                                  <MapPin className="size-3.5" aria-hidden="true" />
                                  {formatLocation(event.location_city)}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-left text-xs text-neutral-400 sm:text-right">
                              <div>{formatDate(event.event_time ?? event.created_at)}</div>
                              <div className="mt-1 flex items-center gap-1 sm:justify-end">
                                <Clock3 className="size-3" aria-hidden="true" />
                                {formatTime(event.event_time ?? event.created_at)}
                              </div>
                            </div>
                          </div>
                        </li>
                    ))}
                  </ol>
                </section>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
