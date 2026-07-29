import { ORDER_BLOCK_POLICY } from "@/lib/constants";
import {
  fetchOutstandingInvoices,
  isSquareConfigured,
  type OutstandingInvoice,
} from "@/lib/square/client";

export type OrderHold = {
  /** True when this buyer must settle up before ordering again. */
  blocked: boolean;
  /** The invoices responsible for the hold (empty when not blocked). */
  invoices: OutstandingInvoice[];
  /** Sum of the blocking invoices, in cents. */
  total_cents: number;
};

const NO_HOLD: OrderHold = { blocked: false, invoices: [], total_cents: 0 };

/**
 * Credit hold check — does this buyer owe Valley money?
 *
 * Reads outstanding invoices straight from Square and applies
 * `ORDER_BLOCK_POLICY` ("unpaid" = any sent-but-unpaid invoice blocks;
 * "overdue" = only past-due ones do).
 *
 * Two deliberate fail-open cases, because wrongly blocking a paying
 * customer is worse than letting one extra order through:
 *   - buyer has no linked Square customer record → nothing to check
 *   - the Square call errors → log it and allow the order
 */
export async function getOrderHold(
  squareCustomerId: string | null | undefined
): Promise<OrderHold> {
  if (!squareCustomerId || !isSquareConfigured()) return NO_HOLD;

  try {
    const outstanding = await fetchOutstandingInvoices(squareCustomerId);
    const blocking =
      ORDER_BLOCK_POLICY === "overdue"
        ? outstanding.filter((i) => i.is_overdue)
        : outstanding;

    return {
      blocked: blocking.length > 0,
      invoices: blocking,
      total_cents: blocking.reduce((sum, i) => sum + i.amount_cents, 0),
    };
  } catch (err) {
    console.error("[order-hold] Square check failed; allowing order:", err);
    return NO_HOLD;
  }
}

/** Buyer-facing explanation of why ordering is paused. */
export function orderHoldMessage(hold: OrderHold): string {
  const n = hold.invoices.length;
  if (n === 0) return "";
  const amount = `$${(hold.total_cents / 100).toFixed(2)}`;
  const noun = n === 1 ? "invoice" : "invoices";
  const verb = ORDER_BLOCK_POLICY === "overdue" ? "past due" : "outstanding";
  return `You have ${n} ${verb} ${noun} totaling ${amount}. Please settle up to place a new order.`;
}
