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

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "roasting",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  roasting: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
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
