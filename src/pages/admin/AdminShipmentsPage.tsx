import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SmartCityInput } from "@/components/admin/SmartCityInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NETWORK_CARRIER_OPTIONS,
  SERVICE_MODE_OPTIONS,
  SHIPMENTS_PAGE_SIZE,
  SHIPMENT_STATUS_OPTIONS,
  createShipment,
  createShipmentWithTrackingEvent,
  deleteShipment,
  getShipmentStats,
  listShipments,
  updateShipment,
  type Shipment,
  type ShipmentSortOrder,
  type ShipmentStatusFilter,
} from "@/features/admin/adminApi";
import {
  capitalizeFirstLetter,
  emptyShipmentFormValues,
  emptyTrackingEventFormValues,
  formatDateTime,
  shipmentFormToInsert,
  trackingEventFormToCreatePayload,
  validateTrackingEvent,
  validateShipment,
  type ShipmentFormErrors,
  type ShipmentFormValues,
  type TrackingEventFormErrors,
  type TrackingEventFormValues,
} from "@/features/admin/formUtils";

const initialFormValues = emptyShipmentFormValues;
const initialTrackingEventValues: TrackingEventFormValues = {
  ...emptyTrackingEventFormValues,
  event_time: initialFormValues.booking_date,
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

function uniqueSortedNames(
  shipments: Shipment[],
  key: "consignor_name" | "consignee_name",
) {
  return Array.from(
    new Set(
      shipments
        .map((shipment) => shipment[key]?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

type HistoricalNameInputProps = {
  id: string;
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
};

function HistoricalNameInput({
  id,
  label,
  value,
  options,
  disabled,
  placeholder,
  error,
  onChange,
}: HistoricalNameInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return [];

    return options
      .filter((option) => option.toLowerCase().includes(query))
      .slice(0, 8);
  }, [options, query]);
  const showSuggestions = isFocused && !disabled && query.length > 0 && matches.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
        {showSuggestions ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-40 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {matches.map((match) => (
              <button
                key={match}
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(match);
                  setIsFocused(false);
                }}
              >
                <span className="truncate">{match}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type ShipmentStats = {
  total: number;
  inTransit: number;
  delivered: number;
};

const initialStats: ShipmentStats = {
  total: 0,
  inTransit: 0,
  delivered: 0,
};

export default function AdminShipmentsPage() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [page, setPage] = useState(1);
  const [totalShipments, setTotalShipments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<ShipmentSortOrder>("newest");

  const [stats, setStats] = useState<ShipmentStats>(initialStats);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createValues, setCreateValues] =
    useState<ShipmentFormValues>(initialFormValues);
  const [createErrors, setCreateErrors] = useState<ShipmentFormErrors>({});
  const [createTrackingValues, setCreateTrackingValues] =
    useState<TrackingEventFormValues>(initialTrackingEventValues);
  const [createTrackingErrors, setCreateTrackingErrors] =
    useState<TrackingEventFormErrors>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [isUploadingPod, setIsUploadingPod] = useState(false);
  const [podUploadError, setPodUploadError] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingShipmentId, setDeletingShipmentId] = useState<string | null>(null);

  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [updatingStatusShipmentId, setUpdatingStatusShipmentId] = useState<
    string | null
  >(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalShipments / SHIPMENTS_PAGE_SIZE)),
    [totalShipments],
  );
  const consignorNameOptions = useMemo(
    () => uniqueSortedNames(shipments, "consignor_name"),
    [shipments],
  );
  const consigneeNameOptions = useMemo(
    () => uniqueSortedNames(shipments, "consignee_name"),
    [shipments],
  );

  const loadData = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { shipments: nextShipments, total } = await listShipments(
          targetPage,
          {
            searchQuery,
            statusFilter,
            sortOrder,
          },
        );
        setShipments(nextShipments);
        setTotalShipments(total);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load shipments.";
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, statusFilter, sortOrder],
  );

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const nextStats = await getShipmentStats();
      setStats(nextStats);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load shipment stats.";
      setStatsError(message);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void loadData(page);
  }, [page, loadData]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleRefresh = async () => {
    await Promise.all([loadData(page), loadStats()]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (page !== 1) setPage(1);
  };

  const handleStatusFilterChange = (value: ShipmentStatusFilter) => {
    setStatusFilter(value);
    if (page !== 1) setPage(1);
  };

  const handleSortOrderChange = (value: ShipmentSortOrder) => {
    setSortOrder(value);
    if (page !== 1) setPage(1);
  };

  const handleCreateValueChange = (
    key: keyof ShipmentFormValues,
    value: string,
  ) => {
    if (
      key === "booking_date" &&
      createTrackingValues.event_time === createValues.booking_date
    ) {
      setCreateTrackingValues((prev) => ({ ...prev, event_time: value }));
      setCreateTrackingErrors((prev) => ({ ...prev, event_time: undefined }));
    }

    setCreateValues((prev) => ({ ...prev, [key]: value }));
    setCreateErrors((prev) => ({ ...prev, [key]: undefined }));
    setCreateError(null);
  };

  const handleCreateCityValueChange = (
    cityKey: "origin_city" | "destination_city",
    countryKey: "origin_country" | "destination_country",
    value: string,
  ) => {
    setCreateValues((prev) => ({
      ...prev,
      [cityKey]: value,
      [countryKey]: "",
    }));
    setCreateErrors((prev) => ({
      ...prev,
      [cityKey]: undefined,
      [countryKey]: undefined,
    }));
    setCreateError(null);
  };

  const handleCreateCitySuggestionSelect = (
    cityKey: "origin_city" | "destination_city",
    countryKey: "origin_country" | "destination_country",
    city: string,
    country: string,
  ) => {
    setCreateValues((prev) => ({
      ...prev,
      [cityKey]: city,
      [countryKey]: country,
    }));
    setCreateErrors((prev) => ({
      ...prev,
      [cityKey]: undefined,
      [countryKey]: undefined,
    }));
    setCreateError(null);
  };

  const handleCreateTrackingValueChange = (
    key: keyof TrackingEventFormValues,
    value: string,
  ) => {
    setCreateTrackingValues((prev) => ({ ...prev, [key]: value }));
    setCreateTrackingErrors((prev) => ({ ...prev, [key]: undefined }));
    setCreateError(null);
  };

  const resetCreateForm = () => {
    setCreateValues(initialFormValues);
    setCreateErrors({});
    setCreateTrackingValues(initialTrackingEventValues);
    setCreateTrackingErrors({});
    setCreateError(null);
    setPodUploadError(null);
  };

  const handlePodFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPod(true);
    setPodUploadError(null);

    try {
      // Use a temporary ID since the shipment doesn't exist yet
      const fileExt = file.name.split(".").pop() || "bin";
      const fileName = `temp-${Date.now()}.${fileExt}`;
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
        setCreateValues((prev) => ({ ...prev, pod_url: data.publicUrl }));
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
    setCreateValues((prev) => ({ ...prev, pod_url: "" }));
    setPodUploadError(null);
    toast({ title: "Proof of Delivery removed" });
  };

  const handleCreateShipment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const validationErrors = validateShipment(createValues);
    const trackingValidationErrors = validateTrackingEvent(createTrackingValues);
    setCreateErrors(validationErrors);
    setCreateTrackingErrors(trackingValidationErrors);

    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(trackingValidationErrors).length > 0
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const shipmentPayload = shipmentFormToInsert(createValues);
      const hasInitialTrackingStatus = createTrackingValues.event_title.trim().length > 0;

      if (hasInitialTrackingStatus) {
        const trackingEventPayload =
          trackingEventFormToCreatePayload(createTrackingValues);
        await createShipmentWithTrackingEvent(shipmentPayload, trackingEventPayload);
      } else {
        await createShipment(shipmentPayload);
      }

      toast({ title: "Shipment created successfully" });
      resetCreateForm();
      setShowCreateForm(false);

      await loadStats();
      if (page === 1) {
        await loadData(1);
      } else {
        setPage(1);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create shipment.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    const shouldDelete = window.confirm(
      "Delete this shipment and all tracking events?",
    );
    if (!shouldDelete) {
      return;
    }

    setDeleteError(null);
    setDeletingShipmentId(shipmentId);
    try {
      await deleteShipment(shipmentId);

      const nextTotal = Math.max(0, totalShipments - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / SHIPMENTS_PAGE_SIZE));
      const nextPage = Math.min(page, nextTotalPages);

      await loadStats();

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadData(nextPage);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete shipment.";
      setDeleteError(message);
    } finally {
      setDeletingShipmentId(null);
    }
  };

  const handleQuickStatusChange = async (
    shipmentId: string,
    nextStatusValue: string,
  ) => {
    const nextStatus = nextStatusValue.trim() ? nextStatusValue : null;
    const current = shipments.find((item) => item.id === shipmentId);
    const currentStatus = current?.status ?? null;
    if (!current || currentStatus === nextStatus) return;

    setStatusUpdateError(null);
    setUpdatingStatusShipmentId(shipmentId);
    try {
      await updateShipment(shipmentId, {
        status: nextStatus,
      });
      await Promise.all([loadStats(), loadData(page)]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update shipment status.";
      setStatusUpdateError(message);
    } finally {
      setUpdatingStatusShipmentId(null);
    }
  };

  const canGoPrev = page > 1 && !isLoading;
  const canGoNext = page < totalPages && !isLoading;

  return (
    <AdminShell
      title="Shipment Dashboard"
      description="Search, filter, sort, and quickly update shipment status from one place."
      actions={
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={isLoading || isLoadingStats}
            className="px-3"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            variant={showCreateForm ? "secondary" : "default"}
            className="px-3"
          >
            <Plus className="size-4" />
            {showCreateForm ? "Hide Form" : "New Shipment"}
          </Button>
        </div>
      }
    >
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {statsError ? (
        <Alert variant="destructive">
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      ) : null}

      {createError ? (
        <Alert variant="destructive">
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      ) : null}

      {deleteError ? (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      ) : null}

      {statusUpdateError ? (
        <Alert variant="destructive">
          <AlertDescription>{statusUpdateError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="px-3 pb-1 pt-3 sm:px-6 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-neutral-600 sm:text-sm">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-semibold sm:text-3xl">
              {isLoadingStats ? <Spinner className="size-5 sm:size-6" /> : stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-3 pb-1 pt-3 sm:px-6 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-neutral-600 sm:text-sm">
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-semibold sm:text-3xl">
              {isLoadingStats ? <Spinner className="size-5 sm:size-6" /> : stats.inTransit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-3 pb-1 pt-3 sm:px-6 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-neutral-600 sm:text-sm">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-semibold sm:text-3xl">
              {isLoadingStats ? <Spinner className="size-5 sm:size-6" /> : stats.delivered}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">Search / Filters</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search_shipments">Search Shipments</Label>
              <Input
                id="search_shipments"
                placeholder="Tracking ID, status, city, country, name"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_filter">Filter by Status</Label>
              <select
                id="status_filter"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusFilterChange(event.target.value as ShipmentStatusFilter)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                {SHIPMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort by Date</Label>
              <select
                id="sort_order"
                value={sortOrder}
                onChange={(event) =>
                  handleSortOrderChange(event.target.value as ShipmentSortOrder)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showCreateForm ? (
        <>
          <button
            type="button"
            aria-label="Close create shipment form"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setShowCreateForm(false)}
          />
          <Card className="fixed inset-x-3 bottom-3 top-3 z-50 flex flex-col overflow-hidden md:static md:z-auto md:block">
          <CardHeader className="shrink-0 px-4 py-4 sm:px-6 sm:py-6">
            <CardTitle>Create Shipment</CardTitle>
            <p className="text-sm text-neutral-500">
              Origin and destination cities are required. Tracking ID accepts
              numbers only when entered.
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 md:overflow-visible">
            <form className="space-y-4" onSubmit={handleCreateShipment} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking_id">Tracking ID</Label>
                  <Input
                    id="tracking_id"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={createValues.tracking_id}
                    onChange={(event) =>
                      handleCreateValueChange(
                        "tracking_id",
                        digitsOnly(event.target.value),
                      )
                    }
                    disabled={isCreating}
                    placeholder="Numbers only"
                  />
                  {createErrors.tracking_id ? (
                    <p className="text-xs text-red-600">{createErrors.tracking_id}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={createValues.status}
                    onChange={(event) =>
                      handleCreateValueChange("status", event.target.value)
                    }
                    disabled={isCreating}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select status</option>
                    {SHIPMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {createErrors.status ? (
                    <p className="text-xs text-red-600">{createErrors.status}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking_date">Booking Date</Label>
                  <Input
                    id="booking_date"
                    type="date"
                    value={createValues.booking_date}
                    onChange={(event) =>
                      handleCreateValueChange("booking_date", event.target.value)
                    }
                    disabled={isCreating}
                  />
                  {createErrors.booking_date ? (
                    <p className="text-xs text-red-600">
                      {createErrors.booking_date}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_mode">Service Mode</Label>
                  <select
                    id="service_mode"
                    value={createValues.service_mode}
                    onChange={(event) =>
                      handleCreateValueChange("service_mode", event.target.value)
                    }
                    disabled={isCreating}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select service mode</option>
                    {SERVICE_MODE_OPTIONS.map((serviceMode) => (
                      <option key={serviceMode} value={serviceMode}>
                        {serviceMode}
                      </option>
                    ))}
                  </select>
                  {createErrors.service_mode ? (
                    <p className="text-xs text-red-600">
                      {createErrors.service_mode}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network_carrier">Network Carrier</Label>
                  <select
                    id="network_carrier"
                    value={createValues.network_carrier}
                    onChange={(event) =>
                      handleCreateValueChange("network_carrier", event.target.value)
                    }
                    disabled={isCreating}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    {NETWORK_CARRIER_OPTIONS.map((carrier) => (
                      <option key={carrier} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                  {createErrors.network_carrier ? (
                    <p className="text-xs text-red-600">
                      {createErrors.network_carrier}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network_tracking_id">Network Tracking ID</Label>
                  <Input
                    id="network_tracking_id"
                    value={createValues.network_tracking_id}
                    onChange={(event) =>
                      handleCreateValueChange(
                        "network_tracking_id",
                        event.target.value,
                      )
                    }
                    disabled={isCreating}
                  />
                  {createErrors.network_tracking_id ? (
                    <p className="text-xs text-red-600">
                      {createErrors.network_tracking_id}
                    </p>
                  ) : null}
                </div>

                <SmartCityInput
                  id="origin_city"
                  label="Origin City"
                  value={createValues.origin_city}
                  onChange={(value) =>
                    handleCreateCityValueChange(
                      "origin_city",
                      "origin_country",
                      value,
                    )
                  }
                  onSuggestionSelect={(city, country) =>
                    handleCreateCitySuggestionSelect(
                      "origin_city",
                      "origin_country",
                      city,
                      country,
                    )
                  }
                  disabled={isCreating}
                  placeholder="Enter origin city"
                  error={createErrors.origin_city}
                />

                <SmartCityInput
                  id="destination_city"
                  label="Destination City"
                  value={createValues.destination_city}
                  onChange={(value) =>
                    handleCreateCityValueChange(
                      "destination_city",
                      "destination_country",
                      value,
                    )
                  }
                  onSuggestionSelect={(city, country) =>
                    handleCreateCitySuggestionSelect(
                      "destination_city",
                      "destination_country",
                      city,
                      country,
                    )
                  }
                  disabled={isCreating}
                  placeholder="Enter destination city"
                  error={createErrors.destination_city}
                />

                <div className="space-y-2">
                  <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                  <Input
                    id="estimated_delivery"
                    type="date"
                    value={createValues.estimated_delivery}
                    onChange={(event) =>
                      handleCreateValueChange(
                        "estimated_delivery",
                        event.target.value,
                      )
                    }
                    disabled={isCreating}
                  />
                  {createErrors.estimated_delivery ? (
                    <p className="text-xs text-red-600">
                      {createErrors.estimated_delivery}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pieces">Pieces</Label>
                  <Input
                    id="pieces"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={createValues.pieces}
                    onChange={(event) =>
                      handleCreateValueChange("pieces", digitsOnly(event.target.value))
                    }
                    disabled={isCreating}
                  />
                  {createErrors.pieces ? (
                    <p className="text-xs text-red-600">{createErrors.pieces}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    inputMode="decimal"
                    value={createValues.weight}
                    onChange={(event) =>
                      handleCreateValueChange(
                        "weight",
                        decimalNumberOnly(event.target.value),
                      )
                    }
                    disabled={isCreating}
                  />
                  {createErrors.weight ? (
                    <p className="text-xs text-red-600">{createErrors.weight}</p>
                  ) : null}
                </div>

                <HistoricalNameInput
                  id="consignor_name"
                  label="Consignor Name"
                  value={createValues.consignor_name}
                  options={consignorNameOptions}
                  onChange={(value) =>
                    handleCreateValueChange("consignor_name", value)
                  }
                  disabled={isCreating}
                  placeholder="Enter consignor name"
                  error={createErrors.consignor_name}
                />

                <HistoricalNameInput
                  id="consignee_name"
                  label="Consignee Name"
                  value={createValues.consignee_name}
                  options={consigneeNameOptions}
                  onChange={(value) =>
                    handleCreateValueChange("consignee_name", value)
                  }
                  disabled={isCreating}
                  placeholder="Enter consignee name"
                  error={createErrors.consignee_name}
                />
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="text-sm font-medium">Initial Tracking Event</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_event_title">Status</Label>
                    <select
                      id="initial_event_title"
                      value={createTrackingValues.event_title}
                      onChange={(event) =>
                        handleCreateTrackingValueChange(
                          "event_title",
                          event.target.value,
                        )
                      }
                      disabled={isCreating}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="">Select status</option>
                      {SHIPMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {createTrackingErrors.event_title ? (
                      <p className="text-xs text-red-600">
                        {createTrackingErrors.event_title}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initial_event_time">Event Time</Label>
                    <Input
                      id="initial_event_time"
                      type="date"
                      value={createTrackingValues.event_time}
                      onChange={(event) =>
                        handleCreateTrackingValueChange(
                          "event_time",
                          event.target.value,
                        )
                      }
                      disabled={isCreating}
                    />
                    {createTrackingErrors.event_time ? (
                      <p className="text-xs text-red-600">
                        {createTrackingErrors.event_time}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <SmartCityInput
                      id="initial_location_city"
                      label="Location City"
                      value={createTrackingValues.location_city}
                      onChange={(value) =>
                        handleCreateTrackingValueChange(
                          "location_city",
                          capitalizeFirstLetter(value),
                        )
                      }
                      disabled={isCreating}
                      placeholder="Enter location city"
                      error={createTrackingErrors.location_city}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="initial_event_description">
                    Status Details / Description
                  </Label>
                  <Textarea
                    id="initial_event_description"
                    value={createTrackingValues.event_description}
                    onChange={(event) =>
                      handleCreateTrackingValueChange(
                        "event_description",
                        event.target.value,
                      )
                    }
                    disabled={isCreating}
                    rows={4}
                  />
                  {createTrackingErrors.event_description ? (
                    <p className="text-xs text-red-600">
                      {createTrackingErrors.event_description}
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

                {createValues.pod_url ? (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-neutral-600">
                      Current POD: <a href={createValues.pod_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">View Document</a>
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
                          disabled={isUploadingPod || isCreating}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemovePod}
                        disabled={isCreating}
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
                        disabled={isUploadingPod || isCreating}
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

              <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t bg-white px-4 py-3 md:static md:mx-0 md:border-t-0 md:px-0 md:py-0">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Spinner />
                      Creating...
                    </>
                  ) : (
                    "Create Shipment"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">Shipments</CardTitle>
          <p className="text-sm text-neutral-500">
            Showing {shipments.length} of {totalShipments} matching shipments.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Status (Quick Update)</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="flex items-center justify-center gap-2 py-6 text-neutral-500">
                      <Spinner />
                      Loading shipments...
                    </div>
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="py-6 text-center text-neutral-500">
                      No shipments found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.tracking_id ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={shipment.status ?? ""}
                          onChange={(event) =>
                            void handleQuickStatusChange(
                              shipment.id,
                              event.target.value,
                            )
                          }
                          disabled={updatingStatusShipmentId === shipment.id}
                          className="h-8 min-w-[140px] rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        >
                          <option value="">Unknown</option>
                          {SHIPMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {updatingStatusShipmentId === shipment.id ? (
                          <Spinner className="size-3" />
                        ) : (
                          <Badge variant="outline">{shipment.status ?? "Unknown"}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.origin_city ?? "-"}, {shipment.origin_country ?? "-"}
                      <span className="px-1">-&gt;</span>
                      {shipment.destination_city ?? "-"},{" "}
                      {shipment.destination_country ?? "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(shipment.booking_date)}</TableCell>
                    <TableCell>{formatDateTime(shipment.estimated_delivery)}</TableCell>
                    <TableCell>{shipment.service_mode ?? "N/A"}</TableCell>
                    <TableCell>{shipment.pieces ?? "N/A"}</TableCell>
                    <TableCell>
                      {shipment.weight == null ? "N/A" : `${shipment.weight} kg`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/shipments/${shipment.id}`}>Edit</Link>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteShipment(shipment.id)}
                          disabled={deletingShipmentId === shipment.id}
                        >
                          {deletingShipmentId === shipment.id ? (
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
          </div>

          <div className="space-y-3 md:hidden">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
                <Spinner />
                Loading shipments...
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-6 text-center text-sm text-neutral-500">
                No shipments found.
              </div>
            ) : (
              shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {shipment.tracking_id ?? "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {shipment.origin_city ?? "-"} to {shipment.destination_city ?? "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {shipment.status ?? "Unknown"}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                    <div>
                      <span className="block text-neutral-400">Booking</span>
                      {formatDateTime(shipment.booking_date)}
                    </div>
                    <div>
                      <span className="block text-neutral-400">Estimated</span>
                      {formatDateTime(shipment.estimated_delivery)}
                    </div>
                    <div>
                      <span className="block text-neutral-400">Service</span>
                      {shipment.service_mode ?? "N/A"}
                    </div>
                    <div>
                      <span className="block text-neutral-400">Weight</span>
                      {shipment.weight == null ? "N/A" : `${shipment.weight} kg`}
                    </div>
                  </div>

                  <div className="mt-3">
                    <select
                      value={shipment.status ?? ""}
                      onChange={(event) =>
                        void handleQuickStatusChange(shipment.id, event.target.value)
                      }
                      disabled={updatingStatusShipmentId === shipment.id}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="">Unknown</option>
                      {SHIPMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/shipments/${shipment.id}`}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeleteShipment(shipment.id)}
                      disabled={deletingShipmentId === shipment.id}
                    >
                      {deletingShipmentId === shipment.id ? (
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
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canGoPrev}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
