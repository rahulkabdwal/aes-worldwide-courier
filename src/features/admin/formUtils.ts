import type {
  Shipment,
  ShipmentInsert,
  ShipmentUpdate,
  TrackingEvent,
  TrackingEventInsert,
  TrackingEventUpdate,
} from "@/features/admin/adminApi";
import {
  NETWORK_CARRIER_OPTIONS,
  SERVICE_MODE_OPTIONS,
  SHIPMENT_STATUS_OPTIONS,
} from "@/features/admin/adminApi";

export type ShipmentFormValues = {
  tracking_id: string;
  status: string;
  destination_city: string;
  destination_country: string;
  booking_date: string;
  delivery_date: string;
  delivery_time: string;
  service_mode: string;
  network_carrier: string;
  network_tracking_id: string;
  consignee_name: string;
  pod_url: string;
};

export type ShipmentFormErrors = Partial<Record<keyof ShipmentFormValues, string>>;

export type TrackingEventFormValues = {
  event_title: string;
  event_description: string;
  location_city: string;
  event_time: string;
};

export type TrackingEventFormErrors = Partial<
  Record<keyof TrackingEventFormValues, string>
>;

function getTodayDateInput() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function getCurrentTimeInput() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

export const emptyShipmentFormValues: ShipmentFormValues = {
  tracking_id: "",
  status: "",
  destination_city: "",
  destination_country: "",
  booking_date: getTodayDateInput(),
  delivery_date: "",
  delivery_time: "",
  service_mode: "",
  network_carrier: "None",
  network_tracking_id: "",
  consignee_name: "",
  pod_url: "",
};

export const emptyTrackingEventFormValues: TrackingEventFormValues = {
  event_title: "",
  event_description: "",
  location_city: "",
  event_time: `${getTodayDateInput()}T${getCurrentTimeInput()}`,
};

export function formatDateTime(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    // Dates selected in the admin are stored at UTC midnight. Keeping their
    // display in UTC prevents the calendar day changing in western timezones.
    ...(isUtcMidnight(value) ? { timeZone: "UTC" } : {}),
  });
}

function isUtcMidnight(value: string) {
  return /T00:00:00(?:\.000)?(?:Z|\+00:00)$/.test(value);
}

export function toDateTimeLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }


  // New date-only values use UTC midnight as a timezone-neutral marker.
  if (isUtcMidnight(value)) {
    return date.toISOString().slice(0, 10);
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 10);
}

export function toTrackingDateTimeLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date format.");
    }
    return date.toISOString();
  }

  // A date input represents a calendar day, not a moment in the user's local
  // timezone. UTC midnight preserves exactly the YYYY-MM-DD that was chosen.
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format.");
  }
  return date.toISOString();
}

function toNullableIsoDateTime(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? toIsoDateTime(trimmed) : null;
}

function toNullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNetworkCarrier(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "None" || trimmed.length === 0 ? null : trimmed;
}

function toNetworkCarrierOption(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return NETWORK_CARRIER_OPTIONS.includes(
    trimmed as (typeof NETWORK_CARRIER_OPTIONS)[number],
  )
    ? trimmed
    : "None";
}

export function capitalizeFirstLetter(value: string | null | undefined) {
  const trimmedStart = (value ?? "").replace(/^\s+/, "");
  if (!trimmedStart) {
    return "";
  }

  return trimmedStart.charAt(0).toUpperCase() + trimmedStart.slice(1);
}

export function shipmentToFormValues(shipment: Shipment): ShipmentFormValues {
  return {
    tracking_id: shipment.tracking_id ?? "",
    status: shipment.status ?? "",
    destination_city: shipment.destination_city ?? "",
    destination_country: shipment.destination_country ?? "",
    booking_date: toDateTimeLocalInput(shipment.booking_date),
    delivery_date: shipment.delivery_date ?? "",
    delivery_time: shipment.delivery_time?.slice(0, 5) ?? "",
    service_mode: shipment.service_mode ?? "",
    network_carrier: toNetworkCarrierOption(shipment.network_carrier),
    network_tracking_id: shipment.network_tracking_id ?? "",
    consignee_name: shipment.consignee_name ?? "",
    pod_url: shipment.pod_url ?? "",
  };
}

export function trackingEventToFormValues(
  trackingEvent: TrackingEvent,
): TrackingEventFormValues {
  return {
    event_title: trackingEvent.event_title ?? "",
    event_description: trackingEvent.event_description ?? "",
    location_city: capitalizeFirstLetter(trackingEvent.location_city),
    event_time: toTrackingDateTimeLocalInput(trackingEvent.event_time),
  };
}

export function validateShipment(
  values: ShipmentFormValues,
  {
    requireDeliveryDetails = false,
    requireStatus = false,
  }: { requireDeliveryDetails?: boolean; requireStatus?: boolean } = {},
) {
  const errors: ShipmentFormErrors = {};

  if (!values.destination_city.trim()) {
    errors.destination_city = "City is required";
  }

  if (requireStatus && !values.status.trim()) {
    errors.status = "Status is required.";
  } else if (
    values.status.trim() &&
    !SHIPMENT_STATUS_OPTIONS.includes(
      values.status.trim() as (typeof SHIPMENT_STATUS_OPTIONS)[number],
    )
  ) {
    errors.status = "Select a valid shipment status.";
  }

  if (
    values.service_mode.trim() &&
    !SERVICE_MODE_OPTIONS.includes(
      values.service_mode.trim() as (typeof SERVICE_MODE_OPTIONS)[number],
    )
  ) {
    errors.service_mode = "Select a valid service mode.";
  }

  if (
    values.network_carrier.trim() &&
    !NETWORK_CARRIER_OPTIONS.includes(
      values.network_carrier.trim() as (typeof NETWORK_CARRIER_OPTIONS)[number],
    )
  ) {
    errors.network_carrier = "Select a valid network carrier.";
  }

  if (values.tracking_id.trim() && !/^\d+$/.test(values.tracking_id.trim())) {
    errors.tracking_id = "Tracking ID must contain numbers only.";
  }

  if (values.booking_date) {
    const bookingDate = new Date(`${values.booking_date}T00:00:00`);
    if (Number.isNaN(bookingDate.getTime())) {
      errors.booking_date = "Booking date has an invalid date.";
    }
  }

  if (requireDeliveryDetails && values.status === "Delivered") {
    if (!values.delivery_date) {
      errors.delivery_date = "Delivery date is required for delivered shipments.";
    }
    if (!values.delivery_time) {
      errors.delivery_time = "Delivery time is required for delivered shipments.";
    }
  }

  return errors;
}

export function validateTrackingEvent(values: TrackingEventFormValues) {
  const errors: TrackingEventFormErrors = {};

  if (values.event_time) {
    const eventDate = new Date(values.event_time);
    if (Number.isNaN(eventDate.getTime())) {
      errors.event_time = "Event date/time is invalid.";
    }
  }

  return errors;
}

export function shipmentFormToInsert(values: ShipmentFormValues): ShipmentInsert {
  return {
    tracking_id: toNullableText(values.tracking_id),
    status: toNullableText(values.status),
    destination_city: toNullableText(values.destination_city),
    destination_country: toNullableText(values.destination_country),
    booking_date: toNullableIsoDateTime(values.booking_date),
    delivery_date: values.status === "Delivered" ? toNullableText(values.delivery_date) : null,
    delivery_time: values.status === "Delivered" ? toNullableText(values.delivery_time) : null,
    service_mode: toNullableText(values.service_mode),
    network_carrier: toNullableNetworkCarrier(values.network_carrier),
    network_tracking_id: toNullableText(values.network_tracking_id),
    consignee_name: toNullableText(capitalizeFirstLetter(values.consignee_name)),
    pod_url: toNullableText(values.pod_url),
  };
}

export function shipmentFormToUpdate(values: ShipmentFormValues): ShipmentUpdate {
  return {
    tracking_id: toNullableText(values.tracking_id),
    status: toNullableText(values.status),
    destination_city: toNullableText(values.destination_city),
    destination_country: toNullableText(values.destination_country),
    booking_date: toNullableIsoDateTime(values.booking_date),
    delivery_date: values.status === "Delivered" ? toNullableText(values.delivery_date) : null,
    delivery_time: values.status === "Delivered" ? toNullableText(values.delivery_time) : null,
    service_mode: toNullableText(values.service_mode),
    network_carrier: toNullableNetworkCarrier(values.network_carrier),
    network_tracking_id: toNullableText(values.network_tracking_id),
    consignee_name: toNullableText(capitalizeFirstLetter(values.consignee_name)),
    pod_url: toNullableText(values.pod_url),
  };
}

export function trackingEventFormToInsert(
  values: TrackingEventFormValues,
  shipmentId: string,
): TrackingEventInsert {
  return {
    shipment_id: shipmentId,
    ...trackingEventFormToCreatePayload(values),
  };
}

export function trackingEventFormToCreatePayload(
  values: TrackingEventFormValues,
): Omit<TrackingEventInsert, "shipment_id"> {
  return {
    event_title: toNullableText(values.event_title),
    event_description: toNullableText(values.event_description),
    location_city: toNullableText(capitalizeFirstLetter(values.location_city)),
    event_time: toNullableIsoDateTime(values.event_time),
  };
}

export function trackingEventFormToUpdate(
  values: TrackingEventFormValues,
): TrackingEventUpdate {
  return {
    event_title: toNullableText(values.event_title),
    event_description: toNullableText(values.event_description),
    location_city: toNullableText(capitalizeFirstLetter(values.location_city)),
    event_time: toNullableIsoDateTime(values.event_time),
  };
}
