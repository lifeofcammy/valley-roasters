export const SITE_NAME = "Valley Specialty Roasters";
export const SITE_DESCRIPTION =
  "Small-batch specialty coffee roasted to order for discerning businesses.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://valleyspecialtyroasters.com";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Order status model.
 *
 * Admin workflow (4 states the client locked in):
 *   received  →  in_process  →  shipped
 *   rejected  (any point — unfulfillable order)
 *
 * Historical rows may still carry legacy values (`pending`, `confirmed`,
 * `roasting`, `delivered`, `cancelled`) so we keep them in the type — but
 * the admin selector only shows the 4 canonical values
 * (`ADMIN_SELECTABLE_STATUSES`), and legacy values are display-mapped via
 * `displayStatusName` in `order-status.ts`.
 */
export const ORDER_STATUSES = [
  "received",
  "in_process",
  "shipped",
  "rejected",
  // legacy — kept for historical rows; not shown in admin selector
  "pending",
  "confirmed",
  "roasting",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * The 4 values an admin can pick on the order detail page, in the order
 * Jackie walks through the workflow.
 */
export const ADMIN_SELECTABLE_STATUSES = [
  "received",
  "in_process",
  "shipped",
  "rejected",
] as const;

export type AdminSelectableStatus = (typeof ADMIN_SELECTABLE_STATUSES)[number];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  received: "bg-yellow-100 text-yellow-800",
  in_process: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  // legacy
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  roasting: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "refunded",
  "failed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ROAST_LEVELS = [
  "light",
  "medium",
  "medium-dark",
  "dark",
] as const;

export type RoastLevel = (typeof ROAST_LEVELS)[number];

/**
 * Delivery fee policy — $5 flat on orders below the free-delivery
 * threshold. Jackie previously added this by hand on Square invoices;
 * now it's automatic. Centralized here so the cart UI, the orders API,
 * and the Square line-item builder all agree.
 */
export const DELIVERY_FEE_CENTS = 500;
export const DELIVERY_FEE_FREE_THRESHOLD_CENTS = 30_000; // $300.00
export const DELIVERY_FEE_LABEL = "Delivery";

export function calculateDeliveryFeeCents(subtotalCents: number): number {
  return subtotalCents < DELIVERY_FEE_FREE_THRESHOLD_CENTS
    ? DELIVERY_FEE_CENTS
    : 0;
}
