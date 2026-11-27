import type { ShipmentStatus, ShipmentStep } from "./ordersApi";

export const statusLabel: Record<ShipmentStatus, string> = {
  PROCESSING: "Processing",
  PACKED: "Packed",
  IN_TRANSIT: "In transit",
  DELAYED: "Delayed",
  DELIVERED: "Delivered"
};

export const statusHeadline: Record<ShipmentStatus, string> = {
  PROCESSING: "Getting ready",
  PACKED: "Packed",
  IN_TRANSIT: "On its way",
  DELAYED: "Running late",
  DELIVERED: "Delivered"
};

export const stepLabel: Record<ShipmentStep["code"], string> = {
  ORDER_CREATED: "Order created",
  PACKED: "Packed",
  LEFT_WAREHOUSE: "Left the warehouse",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : formatter.format(date).replace(",", " ·");
}

export type StatusTone = "success" | "pending" | "error";

export function statusTone(status: ShipmentStatus): StatusTone {
  if (status === "DELIVERED") return "success";
  if (status === "DELAYED") return "error";
  return "pending";
}
