import type { ShipmentStatus } from "./ordersApi";

export const statusLabel: Record<ShipmentStatus, string> = {
  PLACED: "Placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export const statusHeadline: Record<ShipmentStatus, string> = {
  PLACED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "On its way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

/** The timeline names each step the way the store reports it. */
export const stepLabel: Record<ShipmentStatus, string> = {
  PLACED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
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
  if (status === "CANCELLED") return "error";
  return "pending";
}
