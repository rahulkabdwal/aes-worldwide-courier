import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DeliveryDetailsDialog } from "@/components/admin/DeliveryDetailsDialog";
import { ExpandableFormSection } from "@/components/admin/ExpandableFormSection";
import { PodUploadPanel } from "@/components/admin/PodUploadPanel";
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
  getDeliveryDateTimeInput,
  shipmentFormToUpdate,
  shipmentToFormValues,
  splitDeliveryDateTimeInput,
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

type DeliveryDialogFields = {
  receiverName: boolean;
  deliveryDateTime: boolean;
};

type DeliverySnapshot = Pick<
  ShipmentFormValues,
  "status" | "receiver_name" | "delivery_date" | "delivery_time"
>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function getEventDate(value: string) {
  return value.split("T")[0] ?? "";
}

function getEventTime(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? "";
}

function updateEventDate(value: string, date: string) {
  const time = getEventTime(value) || "00:00";
  return date ? `${date}T${time}` : "";
}

function updateEventTime(value: string, time: string) {
  const date = getEventDate(value);
  return date && time ? `${date}T${time}` : date;
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
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryDialogFields, setDeliveryDialogFields] =
    useState<DeliveryDialogFields>({ receiverName: true, deliveryDateTime: true });
  const [deliverySnapshot, setDeliverySnapshot] =
    useState<DeliverySnapshot | null>(null);
  const [deliveryDialogError, setDeliveryDialogError] = useState<string | null>(null);
  const [showTrackingEditor, setShowTrackingEditor] = useState(false);
  const [showPodUpload, setShowPodUpload] = useState(false);

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

    if (key === "status") {
      if (value === "Delivered") {
        setDeliveryDialogError(null);
        const receiverMissing = !shipmentFormValues?.receiver_name.trim();
        const deliveryMissing =
          !shipmentFormValues?.delivery_date || !shipmentFormValues.delivery_time;

        setDeliverySnapshot(
          shipmentFormValues
            ? {
                status: shipmentFormValues.status,
                receiver_name: shipmentFormValues.receiver_name,
                delivery_date: shipmentFormValues.delivery_date,
                delivery_time: shipmentFormValues.delivery_time,
              }
            : null,
        );
        setDeliveryDialogFields({
          receiverName: true,
          deliveryDateTime: true,
        });
        setShowDeliveryDialog(receiverMissing || deliveryMissing);
      } else {
        setShowDeliveryDialog(false);
        setDeliverySnapshot(null);
        setShipmentFormValues((prev) =>
          prev ? { ...prev, delivery_date: "", delivery_time: "" } : prev,
        );
      }
    }
  };

  const confirmDeliveryDetails = () => {
    const receiverMissing = !shipmentFormValues?.receiver_name.trim();
    const deliveryMissing =
      !shipmentFormValues?.delivery_date || !shipmentFormValues.delivery_time;

    if (receiverMissing || deliveryMissing) {
      setDeliveryDialogError(
        receiverMissing && deliveryMissing
          ? "Receiver's name and delivery date/time are required."
          : receiverMissing
            ? "Receiver's name is required."
            : "Delivery date and time are required.",
      );
      return;
    }
    setDeliveryDialogError(null);
    setDeliverySnapshot(null);
    setShowDeliveryDialog(false);
  };

  const onShipmentCityValueChange = (
    cityKey: "destination_city",
    countryKey: "destination_country",
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
    cityKey: "destination_city",
    countryKey: "destination_country",
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

    const validationErrors = validateShipment(shipmentFormValues, {
      requireDeliveryDetails: true,
    });
    setShipmentFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      if (
        shipmentFormValues.status === "Delivered" &&
        (!shipmentFormValues.receiver_name.trim() ||
          !shipmentFormValues.delivery_date ||
          !shipmentFormValues.delivery_time)
      ) {
        setDeliveryDialogError("Receiver's name and delivery date/time are required.");
        setDeliveryDialogFields({ receiverName: true, deliveryDateTime: true });
        setShowDeliveryDialog(true);
      }
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
        setShowTrackingEditor(false);
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
    setShowTrackingEditor(true);
  };

  const cancelTrackingEventEdit = () => {
    setEditingTrackingEventId(null);
    setTrackingEventValues(emptyTrackingEventFormValues);
    setTrackingEventErrors({});
    setTrackingActionError(null);
    setShowTrackingEditor(false);
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
          {shipment.status === "Delivered" ? (
            <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border bg-neutral-50 p-4 text-sm sm:grid-cols-3">
              <div><span className="block text-xs text-neutral-500">Receiver</span><span className="font-medium">{shipment.receiver_name ?? "N/A"}</span></div>
              <div><span className="block text-xs text-neutral-500">Delivery Date</span><span className="font-medium">{shipment.delivery_date ?? "N/A"}</span></div>
              <div><span className="block text-xs text-neutral-500">Delivery Time</span><span className="font-medium">{shipment.delivery_time?.slice(0, 5) ?? "N/A"}</span></div>
            </div>
          ) : null}
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
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
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
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
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
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
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

              <div className="space-y-2">
                <Label htmlFor="detail_receiver_name">
                  Receiver's Name
                  {shipmentFormValues.status === "Delivered" ? (
                    <span className="text-red-600"> *</span>
                  ) : null}
                </Label>
                <Input
                  id="detail_receiver_name"
                  value={shipmentFormValues.receiver_name}
                  onChange={(event) =>
                    onShipmentFieldChange(
                      "receiver_name",
                      capitalizeFirstLetter(event.target.value),
                    )
                  }
                  disabled={isSavingShipment}
                  placeholder="Enter receiver's name"
                />
                {shipmentFormErrors.receiver_name ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.receiver_name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail_delivery_datetime">
                  Delivery Date &amp; Time (Status date and time)
                  {shipmentFormValues.status === "Delivered" ? (
                    <span className="text-red-600"> *</span>
                  ) : null}
                </Label>
                <Input
                  id="detail_delivery_datetime"
                  type="datetime-local"
                  value={getDeliveryDateTimeInput(
                    shipmentFormValues.delivery_date,
                    shipmentFormValues.delivery_time,
                  )}
                  onChange={(event) => {
                    const nextDelivery = splitDeliveryDateTimeInput(
                      event.target.value,
                    );
                    setShipmentFormValues((prev) =>
                      prev ? { ...prev, ...nextDelivery } : prev,
                    );
                    setShipmentFormErrors((prev) => ({
                      ...prev,
                      delivery_date: undefined,
                      delivery_time: undefined,
                    }));
                    setShipmentActionError(null);
                  }}
                  disabled={isSavingShipment}
                />
                {shipmentFormErrors.delivery_date ||
                shipmentFormErrors.delivery_time ? (
                  <p className="text-xs text-red-600">
                    {shipmentFormErrors.delivery_date ??
                      shipmentFormErrors.delivery_time}
                  </p>
                ) : null}
              </div>
            </div>

            <ExpandableFormSection
              title="Proof of Delivery"
              actionLabel="Upload POD"
              open={showPodUpload}
              onOpenChange={setShowPodUpload}
              disabled={isSavingShipment}
            >
              <PodUploadPanel
                podUrl={shipmentFormValues.pod_url}
                error={podUploadError}
                isUploading={isUploadingPod}
                disabled={isSavingShipment}
                onUpload={handlePodFileUpload}
                onRemove={handleRemovePod}
              />
            </ExpandableFormSection>

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

      <DeliveryDetailsDialog
        open={showDeliveryDialog}
        date={shipmentFormValues.delivery_date}
        time={shipmentFormValues.delivery_time}
        receiverName={shipmentFormValues.receiver_name}
        error={deliveryDialogError}
        idPrefix="edit"
        description="Complete only the missing delivery information before saving this shipment as delivered."
        showReceiverName={deliveryDialogFields.receiverName}
        showDeliveryDateTime={deliveryDialogFields.deliveryDateTime}
        onDateChange={(value) => onShipmentFieldChange("delivery_date", value)}
        onTimeChange={(value) => onShipmentFieldChange("delivery_time", value)}
        onReceiverNameChange={(value) =>
          onShipmentFieldChange("receiver_name", capitalizeFirstLetter(value))
        }
        onConfirm={confirmDeliveryDetails}
        onCancel={() => {
          if (deliverySnapshot) {
            setShipmentFormValues((prev) =>
              prev ? { ...prev, ...deliverySnapshot } : prev,
            );
          } else {
            setShipmentFormValues((prev) =>
              prev
                ? {
                    ...prev,
                    status: shipment.status ?? "",
                    receiver_name: shipment.receiver_name ?? "",
                    delivery_date: shipment.delivery_date ?? "",
                    delivery_time: shipment.delivery_time?.slice(0, 5) ?? "",
                  }
                : prev,
            );
          }
          setDeliverySnapshot(null);
          setDeliveryDialogError(null);
          setShowDeliveryDialog(false);
        }}
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <ExpandableFormSection
            title="Initial Tracking Event"
            actionLabel={isEditingTrackingEvent ? "Edit Tracking Event" : "Add Tracking Event"}
            open={showTrackingEditor}
            onOpenChange={(open) => {
              setShowTrackingEditor(open);
              if (!open && isEditingTrackingEvent) cancelTrackingEventEdit();
            }}
            disabled={isSavingTrackingEvent}
          >
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
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={getEventDate(trackingEventValues.event_time)}
                  onChange={(event) =>
                    onTrackingEventFieldChange(
                      "event_time",
                      updateEventDate(
                        trackingEventValues.event_time,
                        event.target.value,
                      ),
                    )
                  }
                  disabled={isSavingTrackingEvent}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time">Event Time</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={getEventTime(trackingEventValues.event_time)}
                  onChange={(event) =>
                    onTrackingEventFieldChange(
                      "event_time",
                      updateEventTime(
                        trackingEventValues.event_time,
                        event.target.value,
                      ),
                    )
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
          </ExpandableFormSection>
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
