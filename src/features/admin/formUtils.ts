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
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  booking_date: string;
  estimated_delivery: string;
  pieces: string;
  weight: string;
  service_mode: string;
  network_carrier: string;
  network_tracking_id: string;
  consignor_name: string;
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

export const emptyShipmentFormValues: ShipmentFormValues = {
  tracking_id: "",
  status: "",
  origin_city: "",
  origin_country: "",
  destination_city: "",
  destination_country: "",
  booking_date: getTodayDateInput(),
  estimated_delivery: "",
  pieces: "",
  weight: "",
  service_mode: "",
  network_carrier: "None",
  network_tracking_id: "",
  consignor_name: "",
  consignee_name: "",
  pod_url: "",
};

export const emptyTrackingEventFormValues: TrackingEventFormValues = {
  event_title: "",
  event_description: "",
  location_city: "",
  event_time: "",
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
  });
}

export function toDateTimeLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 10);
}

function toIsoDateTime(value: string) {
  const date = new Date(`${value}T00:00:00`);
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
    origin_city: shipment.origin_city ?? "",
    origin_country: shipment.origin_country ?? "",
    destination_city: shipment.destination_city ?? "",
    destination_country: shipment.destination_country ?? "",
    booking_date: toDateTimeLocalInput(shipment.booking_date),
    estimated_delivery: toDateTimeLocalInput(shipment.estimated_delivery),
    pieces:
      typeof shipment.pieces === "number" && Number.isFinite(shipment.pieces)
        ? String(shipment.pieces)
        : "",
    weight:
      typeof shipment.weight === "number" && Number.isFinite(shipment.weight)
        ? String(shipment.weight)
        : "",
    service_mode: shipment.service_mode ?? "",
    network_carrier: toNetworkCarrierOption(shipment.network_carrier),
    network_tracking_id: shipment.network_tracking_id ?? "",
    consignor_name: shipment.consignor_name ?? "",
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
    event_time: toDateTimeLocalInput(trackingEvent.event_time),
  };
}

export function validateShipment(values: ShipmentFormValues) {
  const errors: ShipmentFormErrors = {};

  if (!values.origin_city.trim()) {
    errors.origin_city = "City is required";
  }

  if (!values.destination_city.trim()) {
    errors.destination_city = "City is required";
  }

  if (
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

  if (values.estimated_delivery) {
    const estimatedDate = new Date(`${values.estimated_delivery}T00:00:00`);
    if (Number.isNaN(estimatedDate.getTime())) {
      errors.estimated_delivery = "Estimated delivery has an invalid date.";
    }
  }

  if (values.pieces.trim() && !/^\d+$/.test(values.pieces.trim())) {
    errors.pieces = "Pieces must contain numbers only.";
  }

  if (values.weight.trim()) {
    const normalizedWeight = values.weight.trim();
    const parsedWeight = Number(normalizedWeight);
    if (
      !/^\d+(\.\d+)?$/.test(normalizedWeight) ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 0
    ) {
      errors.weight = "Weight must contain numbers only.";
    }
  }

  return errors;
}

export function validateTrackingEvent(values: TrackingEventFormValues) {
  const errors: TrackingEventFormErrors = {};

  if (values.event_time) {
    const eventDate = new Date(`${values.event_time}T00:00:00`);
    if (Number.isNaN(eventDate.getTime())) {
      errors.event_time = "Event time has an invalid date.";
    }
  }

  return errors;
}

export function shipmentFormToInsert(values: ShipmentFormValues): ShipmentInsert {
  return {
    tracking_id: toNullableText(values.tracking_id),
    status: toNullableText(values.status),
    origin_city: toNullableText(values.origin_city),
    origin_country: toNullableText(values.origin_country),
    destination_city: toNullableText(values.destination_city),
    destination_country: toNullableText(values.destination_country),
    booking_date: toNullableIsoDateTime(values.booking_date),
    estimated_delivery: toNullableIsoDateTime(values.estimated_delivery),
    pieces: values.pieces.trim() ? Number(values.pieces) : null,
    weight: values.weight.trim() ? Number(values.weight) : null,
    service_mode: toNullableText(values.service_mode),
    network_carrier: toNullableNetworkCarrier(values.network_carrier),
    network_tracking_id: toNullableText(values.network_tracking_id),
    consignor_name: toNullableText(capitalizeFirstLetter(values.consignor_name)),
    consignee_name: toNullableText(capitalizeFirstLetter(values.consignee_name)),
    pod_url: toNullableText(values.pod_url),
  };
}

export function shipmentFormToUpdate(values: ShipmentFormValues): ShipmentUpdate {
  return {
    tracking_id: toNullableText(values.tracking_id),
    status: toNullableText(values.status),
    origin_city: toNullableText(values.origin_city),
    origin_country: toNullableText(values.origin_country),
    destination_city: toNullableText(values.destination_city),
    destination_country: toNullableText(values.destination_country),
    booking_date: toNullableIsoDateTime(values.booking_date),
    estimated_delivery: toNullableIsoDateTime(values.estimated_delivery),
    pieces: values.pieces.trim() ? Number(values.pieces) : null,
    weight: values.weight.trim() ? Number(values.weight) : null,
    service_mode: toNullableText(values.service_mode),
    network_carrier: toNullableNetworkCarrier(values.network_carrier),
    network_tracking_id: toNullableText(values.network_tracking_id),
    consignor_name: toNullableText(capitalizeFirstLetter(values.consignor_name)),
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
