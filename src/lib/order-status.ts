/**
 * Friendly, customer-facing status labels for an order.
 *
 * Combines `orders.status`, `orders.payment_status`, and the cached
 * `orders.square_invoice_status` into a single label + color that
 * makes sense to a wholesale customer. Use this on the customer
 * portal. Admin pages can still show the raw fields separately.
 */

export type DisplayStatusKey =
  | "rejected"
  | "delivered"
  | "shipped"
  | "in_process"
  | "invoice_sent"
  | "received";

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

  // Rejected / cancelled — terminal failure state
  if (
    status === "rejected" ||
    status === "cancelled" ||
    squareInvoice === "CANCELED"
  ) {
    return {
      key: "rejected",
      label: "Rejected",
      description:
        "This order was rejected. Check the cancellation email from Square for details.",
      className:
        "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    };
  }

  // Delivered — legacy status, still renders for historical rows
  if (status === "delivered") {
    return {
      key: "delivered",
      label: "Delivered",
      description: "Your order was delivered. Thanks!",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }

  // Shipped — admin-set; terminal state in the new 4-status model
  if (status === "shipped") {
    return {
      key: "shipped",
      label: "Shipped — on the way",
      description: "Your order is in transit.",
      className:
        "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    };
  }

  // In process — either the admin flipped the status OR the invoice was
  // published (Square emailed the buyer their invoice = we've begun work).
  // `roasting` is the legacy value from before the 4-status simplification.
  if (status === "in_process" || status === "roasting") {
    return {
      key: "in_process",
      label: "In process",
      description:
        "We've started preparing your order. You'll hear from us again when it ships.",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    };
  }

  if (paymentStatus === "paid" || squareInvoice === "PAID") {
    return {
      key: "in_process",
      label: "Paid — in process",
      description:
        "We received your payment and have begun preparing your order.",
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

  // Default: DRAFT invoice or no invoice yet — order received, not yet started
  return {
    key: "received",
    label: "Order received",
    description:
      "We got your order and will send you an invoice shortly. Nothing to do on your end.",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  };
}

/**
 * Humanize a raw order.status value for display. Handles both the
 * canonical 4-status model (`received` / `in_process` / `shipped` /
 * `rejected`) and legacy values still present on historical rows
 * (`pending`, `confirmed`, `roasting`, `delivered`, `cancelled`).
 */
export function displayStatusName(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    // Canonical 4
    case "received":
      return "Order received";
    case "in_process":
      return "In process";
    case "shipped":
      return "Shipped";
    case "rejected":
      return "Rejected";
    // Legacy — map to the closest canonical label
    case "pending":
      return "Order received";
    case "confirmed":
      return "Order received";
    case "roasting":
      return "In process";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Rejected";
    default:
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
  }
}

/**
 * Map any raw status value (legacy or canonical) to the single
 * canonical admin-selectable value. Used when rendering the admin
 * `<Select>` defaultValue so legacy rows land on the right option.
 */
export function toCanonicalStatus(
  status: string | null | undefined
):
  | "received"
  | "in_process"
  | "shipped"
  | "rejected" {
  const s = (status ?? "").toLowerCase();
  if (s === "in_process" || s === "roasting") return "in_process";
  if (s === "shipped") return "shipped";
  if (s === "rejected" || s === "cancelled") return "rejected";
  // received, pending, confirmed, anything else → received
  return "received";
}
