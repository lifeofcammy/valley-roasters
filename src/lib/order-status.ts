/**
 * Friendly, customer-facing status labels for an order.
 *
 * Combines `orders.status`, `orders.payment_status`, and the cached
 * `orders.square_invoice_status` into a single label + color that
 * makes sense to a wholesale customer. Use this on the customer
 * portal. Admin pages can still show the raw fields separately.
 */

export type DisplayStatusKey =
  | "cancelled"
  | "delivered"
  | "shipped"
  | "in_production"
  | "invoice_sent"
  | "awaiting_review";

export interface DisplayStatus {
  key: DisplayStatusKey;
  label: string;
  description: string;
  /** Tailwind utility classes for the badge */
  className: string;
}

export interface OrderForStatus {
  status?: string | null;
  payment_status?: string | null;
  square_invoice_status?: string | null;
  square_invoice_id?: string | null;
}

export function getDisplayStatus(order: OrderForStatus): DisplayStatus {
  const status = (order.status ?? "").toLowerCase();
  const paymentStatus = (order.payment_status ?? "").toLowerCase();
  const squareInvoice = (order.square_invoice_status ?? "").toUpperCase();

  if (status === "cancelled" || squareInvoice === "CANCELED") {
    return {
      key: "cancelled",
      label: "Cancelled",
      description: "This order was cancelled.",
      className:
        "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    };
  }

  if (status === "delivered") {
    return {
      key: "delivered",
      label: "Delivered",
      description: "Your order was delivered. Thanks!",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }

  if (status === "shipped") {
    return {
      key: "shipped",
      label: "Shipped — on the way",
      description: "Your order is in transit.",
      className:
        "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    };
  }

  if (paymentStatus === "paid" || squareInvoice === "PAID") {
    return {
      key: "in_production",
      label: "Paid — in production",
      description: "We received your payment and have begun preparing your order.",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }

  if (squareInvoice === "UNPAID") {
    return {
      key: "invoice_sent",
      label: "Invoice sent — awaiting payment",
      description:
        "We've sent you an invoice by email. Pay online to begin production.",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    };
  }

  // Default: DRAFT invoice or no invoice yet — waiting on Valley to review
  return {
    key: "awaiting_review",
    label: "Awaiting review",
    description:
      "Our team is reviewing your order. You'll receive an invoice by email shortly.",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  };
}

/**
 * Humanize a raw order.status value for display. The DB value
 * 'roasting' is an historical label — we display "In production"
 * because Valley also fulfills non-coffee items.
 */
export function displayStatusName(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "roasting":
      return "In production";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
  }
}
