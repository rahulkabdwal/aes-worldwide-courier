import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SmartCityInput } from "@/components/admin/SmartCityInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import {
  NETWORK_CARRIER_OPTIONS,
  SERVICE_MODE_OPTIONS,
  SHIPMENT_STATUS_OPTIONS,
  createTrackingEvent,
  deleteTrackingEvent,
  getShipmentById,
  listTrackingEvents,
  updateShipment,
  updateTrackingEvent,
  type Shipment,
  type TrackingEvent,
} from "@/features/admin/adminApi";
import {
  capitalizeFirstLetter,
  emptyTrackingEventFormValues,
  formatDateTime,
  shipmentFormToUpdate,
  shipmentToFormValues,
  trackingEventFormToInsert,
  trackingEventFormToUpdate,
  trackingEventToFormValues,
  validateShipment,
  validateTrackingEvent,
  type ShipmentFormErrors,
  type ShipmentFormValues,
  type TrackingEventFormErrors,
  type TrackingEventFormValues,
} from "@/features/admin/formUtils";

type AdminShipmentDetailPageProps = {
  shipmentId: string;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function decimalNumberOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...decimalParts] = cleaned.split(".");
  return decimalParts.length > 0
    ? `${whole}.${decimalParts.join("")}`
    : whole;
}

export default function AdminShipmentDetailPage({
  shipmentId,
}: AdminShipmentDetailPageProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const sortEventsByTimeDesc = useCallback((items: TrackingEvent[]) => {
    return [...items].sort(
      (a, b) =>
        new Date(b.event_time ?? 0).getTime() -
        new Date(a.event_time ?? 0).getTime(),
    );
  }, []);

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [shipmentFormValues, setShipmentFormValues] =
    useState<ShipmentFormValues | null>(null);
  const [shipmentFormErrors, setShipmentFormErrors] =
    useState<ShipmentFormErrors>({});

  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [trackingEventValues, setTrackingEventValues] =
    useState<TrackingEventFormValues>(emptyTrackingEventFormValues);
  const [trackingEventErrors, setTrackingEventErrors] =
    useState<TrackingEventFormErrors>({});
  const [editingTrackingEventId, setEditingTrackingEventId] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [shipmentActionError, setShipmentActionError] = useState<string | null>(null);
  const [trackingActionError, setTrackingActionError] = useState<string | null>(
    null,
  );
  const [isSavingShipment, setIsSavingShipment] = useState(false);
  const [isSavingTrackingEvent, setIsSavingTrackingEvent] = useState(false);
  const [deletingTrackingEventId, setDeletingTrackingEventId] = useState<
    string | null
  >(null);

  const [isUploadingPod, setIsUploadingPod] = useState(false);
  const [podUploadError, setPodUploadError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [nextShipment, nextTrackingEvents] = await Promise.all([
        getShipmentById(shipmentId),
        listTrackingEvents(shipmentId),
      ]);
      setShipment(nextShipment);
      setShipmentFormValues(shipmentToFormValues(nextShipment));
      setTrackingEvents(sortEventsByTimeDesc(nextTrackingEvents));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load shipment details.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId, sortEventsByTimeDesc]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const isEditingTrackingEvent = useMemo(
    () => editingTrackingEventId !== null,
    [editingTrackingEventId],
  );

  const onShipmentFieldChange = (
    key: keyof ShipmentFormValues,
    value: string,
  ) => {
    setShipmentFormValues((prev) => (prev ? { ...prev, [key]: value } : prev));
    setShipmentFormErrors((prev) => ({ ...prev, [key]: undefined }));
    setShipmentActionError(null);
  };

  const onShipmentCityValueChange = (
    cityKey: "origin_city" | "destination_city",
    countryKey: "origin_country" | "destination_country",
    value: string,
  ) => {
    setShipmentFormValues((prev) =>
      prev
        ? {
            ...prev,
            [cityKey]: value,
            [countryKey]: "",
          }
        : prev,
    );
    setShipmentFormErrors((prev) => ({
      ...prev,
      [cityKey]: undefined,
      [countryKey]: undefined,
    }));
    setShipmentActionError(null);
  };

  const onShipmentCitySuggestionSelect = (
    cityKey: "origin_city" | "destination_city",
    countryKey: "origin_country" | "destination_country",
    city: string,
    country: string,
  ) => {
    setShipmentFormValues((prev) =>
      prev
        ? {
            ...prev,
            [cityKey]: city,
            [countryKey]: country,
          }
        : prev,
    );
    setShipmentFormErrors((prev) => ({
      ...prev,
      [cityKey]: undefined,
      [countryKey]: undefined,
    }));
    setShipmentActionError(null);
  };

  const onTrackingEventFieldChange = (
    key: keyof TrackingEventFormValues,
    value: string,
  ) => {
    setTrackingEventValues((prev) => ({ ...prev, [key]: value }));
    setTrackingEventErrors((prev) => ({ ...prev, [key]: undefined }));
    setTrackingActionError(null);
  };

  const handleSaveShipment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipment || !shipmentFormValues) return;

    setShipmentActionError(null);

    const validationErrors = validateShipment(shipmentFormValues);
    setShipmentFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSavingShipment(true);
    try {
      const payload = shipmentFormToUpdate(shipmentFormValues);
      const updatedShipment = await updateShipment(shipment.id, payload);
      setShipment(updatedShipment);
      setShipmentFormValues(shipmentToFormValues(updatedShipment));
      toast({ title: "Shipment updated successfully" });
      navigate("/admin/shipments");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save shipment.";
      setShipmentActionError(message);
    } finally {
      setIsSavingShipment(false);
    }
  };

  const handleSubmitTrackingEvent = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setTrackingActionError(null);

    const validationErrors = validateTrackingEvent(trackingEventValues);
    setTrackingEventErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSavingTrackingEvent(true);
    try {
      if (editingTrackingEventId) {
        const payload = trackingEventFormToUpdate(trackingEventValues);
        const updatedTrackingEvent = await updateTrackingEvent(
          editingTrackingEventId,
          payload,
        );
        setTrackingEvents((prev) =>
          sortEventsByTimeDesc(
            prev.map((event) =>
              event.id === updatedTrackingEvent.id ? updatedTrackingEvent : event,
            ),
          ),
        );
        toast({ title: "Tracking event updated successfully" });
        cancelTrackingEventEdit();
      } else {
        const payload = trackingEventFormToInsert(trackingEventValues, shipmentId);
        const createdTrackingEvent = await createTrackingEvent(payload);
        setTrackingEvents((prev) =>
          sortEventsByTimeDesc([...prev, createdTrackingEvent]),
        );
        toast({ title: "Tracking event added successfully" });
        setTrackingEventValues(emptyTrackingEventFormValues);
        setTrackingEventErrors({});
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save tracking event.";
      setTrackingActionError(message);
    } finally {
      setIsSavingTrackingEvent(false);
    }
  };

  const handleEditTrackingEvent = (trackingEvent: TrackingEvent) => {
    setEditingTrackingEventId(trackingEvent.id);
    setTrackingEventValues(trackingEventToFormValues(trackingEvent));
    setTrackingEventErrors({});
    setTrackingActionError(null);
  };

  const cancelTrackingEventEdit = () => {
    setEditingTrackingEventId(null);
    setTrackingEventValues(emptyTrackingEventFormValues);
    setTrackingEventErrors({});
    setTrackingActionError(null);
  };

  const handleDeleteTrackingEvent = async (trackingEventId: string) => {
    const shouldDelete = window.confirm("Delete this tracking event?");
    if (!shouldDelete) return;

    setTrackingActionError(null);
    setDeletingTrackingEventId(trackingEventId);
    try {
      await deleteTrackingEvent(trackingEventId);
      const refreshedEvents = await listTrackingEvents(shipmentId);
      setTrackingEvents(sortEventsByTimeDesc(refreshedEvents));

      if (editingTrackingEventId === trackingEventId) {
        cancelTrackingEventEdit();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete tracking event.";
      setTrackingActionError(message);
    } finally {
      setDeletingTrackingEventId(null);
    }
  };

  const handlePodFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !shipment) return;

    setIsUploadingPod(true);
    setPodUploadError(null);

    try {
      const fileExt = file.name.split(".").pop() || "bin";
      const fileName = `${shipment.id}-${Date.now()}.${fileExt}`;
      const filePath = `pod_documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("pod_documents")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("pod_documents")
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        setShipmentFormValues((prev) =>
          prev ? { ...prev, pod_url: data.publicUrl } : prev,
        );
        toast({ title: "Proof of Delivery uploaded successfully" });
      } else {
        throw new Error("Failed to get public URL for uploaded file");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload Proof of Delivery.";
      setPodUploadError(message);
      toast({ title: "Upload Error", description: message, variant: "destructive" });
    } finally {
      setIsUploadingPod(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleRemovePod = () => {
    setShipmentFormValues((prev) =>
      prev ? { ...prev, pod_url: "" } : prev,
    );
    setPodUploadError(null);
    toast({ title: "Proof of Delivery removed" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (loadError || !shipment || !shipmentFormValues) {
    return (
      <AdminShell
        title="Shipment Details"
        description="Unable to load shipment details."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/shipments">Back to Shipments</Link>
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? "Shipment not found."}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={`Shipment ${shipment.tracking_id ?? "N/A"}`}
      description={`Created ${formatDateTime(shipment.created_at)} | Shipment ID: ${shipment.id}`}
      actions={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void loadPageData()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/shipments">Back to Shipments</Link>
          </Button>
        </div>
      }
    >
      {shipmentActionError ? (
        <Alert variant="destructive">
          <AlertDescription>{shipmentActionError}</AlertDescription>
        </Alert>
      ) : null}

      {trackingActionError ? (
        <Alert variant="destructive">
          <AlertDescription>{trackingActionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" />
      <Card className="fixed inset-x-3 bottom-3 top-3 z-50 flex flex-col overflow-hidden md:static md:z-auto md:block">
        <CardHeader className="shrink-0 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              Shipment Information
              <Badge variant="outline">{shipment.status ?? "Unknown"}</Badge>
            </CardTitle>
            <Button asChild type="button" variant="ghost" size="sm" className="md:hidden">
              <Link href="/admin/shipments" aria-label="Close edit form">
                <X className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 md:overflow-visible">
          <form className="space-y-4" onSubmit={handleSaveShipment} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detail_tracking_id">Tracking ID</Label>
                <Input
                  id="detail_tracking_id"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={shipmentFormValues.tracking_id}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "tracking_id",
                      digitsOnly(event.target.value),
                    )
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.tracking_id ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.tracking_id}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_status">Status</Label>
                <select
                  id="detail_status"
                  value={shipmentFormValues.status}
                  onChange={(event) =>
                    onShipmentFieldChange("status", event.target.value)
                  }
                  disabled={isSavingShipment}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Select status</option>
                  {SHIPMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {shipmentFormErrors.status ? (
                  <p className="text-xs text-red-600">{shipmentFormErrors.status}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_booking_date">Booking Date</Label>
                <Input
                  id="detail_booking_date"
                  type="date"
                  value={shipmentFormValues.booking_date}
                  onChange={(event) =>
                    onShipmentFieldChange("booking_date", event.target.value)
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.booking_date ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.booking_date}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_service_mode">Service Mode</Label>
                <select
                  id="detail_service_mode"
                  value={shipmentFormValues.service_mode}
                  onChange={(event) =>
                    onShipmentFieldChange("service_mode", event.target.value)
                  }
                  disabled={isSavingShipment}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Select service mode</option>
                  {SERVICE_MODE_OPTIONS.map((serviceMode) => (
                    <option key={serviceMode} value={serviceMode}>
                      {serviceMode}
                    </option>
                  ))}
                </select>
                {shipmentFormErrors.service_mode ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.service_mode}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_network_carrier">Network Carrier</Label>
                <select
                  id="detail_network_carrier"
                  value={shipmentFormValues.network_carrier}
                  onChange={(event) =>
                    onShipmentFieldChange("network_carrier", event.target.value)
                  }
                  disabled={isSavingShipment}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  {NETWORK_CARRIER_OPTIONS.map((carrier) => (
                    <option key={carrier} value={carrier}>
                      {carrier}
                    </option>
                  ))}
                </select>
                {shipmentFormErrors.network_carrier ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.network_carrier}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_network_tracking_id">
                  Network Tracking ID
                </Label>
                <Input
                  id="detail_network_tracking_id"
                  value={shipmentFormValues.network_tracking_id}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "network_tracking_id",
                      event.target.value,
                    )
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.network_tracking_id ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.network_tracking_id}
                  </p>
                ) : null}
              </div>

              <SmartCityInput
                id="detail_origin_city"
                label="Origin City"
                value={shipmentFormValues.origin_city}
                onChange={(value) =>
                  onShipmentCityValueChange(
                    "origin_city",
                    "origin_country",
                    value,
                  )
                }
                onSuggestionSelect={(city, country) =>
                  onShipmentCitySuggestionSelect(
                    "origin_city",
                    "origin_country",
                    city,
                    country,
                  )
                }
                disabled={isSavingShipment}
                placeholder="Enter origin city"
                error={shipmentFormErrors.origin_city}
              />

              <SmartCityInput
                id="detail_destination_city"
                label="Destination City"
                value={shipmentFormValues.destination_city}
                onChange={(value) =>
                  onShipmentCityValueChange(
                    "destination_city",
                    "destination_country",
                    value,
                  )
                }
                onSuggestionSelect={(city, country) =>
                  onShipmentCitySuggestionSelect(
                    "destination_city",
                    "destination_country",
                    city,
                    country,
                  )
                }
                disabled={isSavingShipment}
                placeholder="Enter destination city"
                error={shipmentFormErrors.destination_city}
              />

              <div className="space-y-2">
                <Label htmlFor="detail_estimated_delivery">Estimated Delivery</Label>
                <Input
                  id="detail_estimated_delivery"
                  type="date"
                  value={shipmentFormValues.estimated_delivery}
                  onChange={(event) =>
                    onShipmentFieldChange("estimated_delivery", event.target.value)
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.estimated_delivery ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.estimated_delivery}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_pieces">Pieces</Label>
                <Input
                  id="detail_pieces"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={shipmentFormValues.pieces}
                  onChange={(event) =>
                    onShipmentFieldChange("pieces", digitsOnly(event.target.value))
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.pieces ? (
                  <p className="text-xs text-red-600">{shipmentFormErrors.pieces}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_weight">Weight (kg)</Label>
                <Input
                  id="detail_weight"
                  inputMode="decimal"
                  value={shipmentFormValues.weight}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "weight",
                      decimalNumberOnly(event.target.value),
                    )
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.weight ? (
                  <p className="text-xs text-red-600">{shipmentFormErrors.weight}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_consignor_name">Consignor Name</Label>
                <Input
                  id="detail_consignor_name"
                  value={shipmentFormValues.consignor_name}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "consignor_name",
                      capitalizeFirstLetter(event.target.value),
                    )
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.consignor_name ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.consignor_name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_consignee_name">Consignee Name</Label>
                <Input
                  id="detail_consignee_name"
                  value={shipmentFormValues.consignee_name}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "consignee_name",
                      capitalizeFirstLetter(event.target.value),
                    )
                  }
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.consignee_name ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.consignee_name}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-4">Proof of Delivery (POD)</h3>
              
              {podUploadError && (
                <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {podUploadError}
                </div>
              )}

              {shipmentFormValues.pod_url ? (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-neutral-600">
                    Current POD: <a href={shipmentFormValues.pod_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">View Document</a>
                  </p>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <div className="flex items-center justify-center w-full px-4 py-2 border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
                        <span className="text-sm font-medium">Replace POD</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePodFileUpload}
                        disabled={isUploadingPod || isSavingShipment}
                        className="hidden"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePod}
                      disabled={isSavingShipment}
                    >
                      Remove POD
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block">
                    <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-700">Upload Proof of Delivery</p>
                        <p className="text-xs text-neutral-500 mt-1">Image or PDF file</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePodFileUpload}
                      disabled={isUploadingPod || isSavingShipment}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {isUploadingPod && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Spinner className="size-4" />
                  Uploading...
                </div>
              )}
            </div>

            <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-white px-4 py-3 md:static md:mx-0 md:border-t-0 md:px-0 md:py-0">
              <Button type="submit" disabled={isSavingShipment}>
                {isSavingShipment ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  "Save Shipment"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSavingShipment}
                onClick={() => setShipmentFormValues(shipmentToFormValues(shipment))}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditingTrackingEvent ? "Edit Tracking Event" : "Add Tracking Event"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmitTrackingEvent} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_title">Event Title</Label>
                <Input
                  id="event_title"
                  value={trackingEventValues.event_title}
                  onChange={(event) =>
                    onTrackingEventFieldChange("event_title", event.target.value)
                  }
                  disabled={isSavingTrackingEvent}
                />
                {trackingEventErrors.event_title ? (
                  <p className="text-xs text-red-600">
                    {trackingEventErrors.event_title}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time">Event Time</Label>
                <Input
                  id="event_time"
                  type="date"
                  value={trackingEventValues.event_time}
                  onChange={(event) =>
                    onTrackingEventFieldChange("event_time", event.target.value)
                  }
                  disabled={isSavingTrackingEvent}
                />
                {trackingEventErrors.event_time ? (
                  <p className="text-xs text-red-600">
                    {trackingEventErrors.event_time}
                  </p>
                ) : null}
              </div>

              <SmartCityInput
                id="location_city"
                label="Location City"
                value={trackingEventValues.location_city}
                onChange={(value) =>
                  onTrackingEventFieldChange(
                    "location_city",
                    capitalizeFirstLetter(value),
                  )
                }
                disabled={isSavingTrackingEvent}
                placeholder="Enter location city"
                error={trackingEventErrors.location_city}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_description">Event Description</Label>
              <Textarea
                id="event_description"
                value={trackingEventValues.event_description}
                onChange={(event) =>
                  onTrackingEventFieldChange("event_description", event.target.value)
                }
                disabled={isSavingTrackingEvent}
                rows={4}
              />
              {trackingEventErrors.event_description ? (
                <p className="text-xs text-red-600">
                  {trackingEventErrors.event_description}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSavingTrackingEvent}>
                {isSavingTrackingEvent ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : isEditingTrackingEvent ? (
                  "Update Event"
                ) : (
                  "Add Event"
                )}
              </Button>
              {isEditingTrackingEvent ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingTrackingEvent}
                  onClick={cancelTrackingEventEdit}
                >
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Event Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackingEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <p className="py-6 text-center text-neutral-500">
                      No tracking events yet.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                trackingEvents.map((trackingEvent) => (
                  <TableRow key={trackingEvent.id}>
                    <TableCell className="font-medium">
                      {trackingEvent.event_title}
                    </TableCell>
                    <TableCell>
                      {trackingEvent.location_city ?? "N/A"}
                    </TableCell>
                    <TableCell>{formatDateTime(trackingEvent.event_time)}</TableCell>
                    <TableCell className="max-w-sm truncate">
                      {trackingEvent.event_description}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTrackingEvent(trackingEvent)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            void handleDeleteTrackingEvent(trackingEvent.id)
                          }
                          disabled={deletingTrackingEventId === trackingEvent.id}
                        >
                          {deletingTrackingEventId === trackingEvent.id ? (
                            <>
                              <Spinner />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
