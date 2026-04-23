import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { displayStatusName } from "@/lib/order-status";
import { format } from "date-fns";
import {
  ChevronRight,
  Repeat,
  CalendarClock,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  isSquareConfigured,
  fetchAllSquareSubscriptions,
  fetchSquareInvoices,
  formatSquareCadence,
  type SquareSubscriptionDetail,
  type SquareInvoiceSummary,
} from "@/lib/square/client";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

/* ------------------------------------------------------------------ */
/* Recurring-order types (unified from Square subs + invoice patterns) */
/* ------------------------------------------------------------------ */

type RecurringOrder = {
  id: string;
  customer_name: string;
  frequency: string;
  amount_cents: number;
  status: string;
  next_date: string | null;
  source: "subscription" | "invoice";
  invoice_count?: number;
};

/** Detect recurring cadence from a series of dates. */
function detectFrequency(dates: Date[]): string {
  if (dates.length < 2) return "—";
  let totalDays = 0;
  for (let i = 1; i < dates.length; i++) {
    totalDays +=
      (dates[i].getTime() - dates[i - 1].getTime()) / 86_400_000;
  }
  const avgDays = totalDays / (dates.length - 1);
  if (avgDays <= 9) return "Weekly";
  if (avgDays <= 18) return "Every 2 weeks";
  if (avgDays <= 45) return "Monthly";
  if (avgDays <= 100) return "Quarterly";
  return `~${Math.round(avgDays)} days`;
}

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE")
    return (
      <Badge
        variant="default"
        className="bg-green-600/90 text-white hover:bg-green-600"
      >
        Active
      </Badge>
    );
  if (s === "PAUSED")
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
        Paused
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const admin = createAdminClient();

  /* --------------------------------------------------------------- */
  /* 1. Recurring data — live from Square                            */
  /* --------------------------------------------------------------- */
  let squareSubs: SquareSubscriptionDetail[] = [];
  let squareInvoices: SquareInvoiceSummary[] = [];

  try {
    if (isSquareConfigured()) {
      [squareSubs, squareInvoices] = await Promise.all([
        fetchAllSquareSubscriptions(),
        fetchSquareInvoices({ limit: 200 }),
      ]);
    }
  } catch (err) {
    // Square unavailable — page still works, just no recurring data.
    console.error("admin/orders — Square recurring fetch failed:", err);
  }

  // Build a customer_id → company_name lookup from invoice recipients
  // (Square invoices carry the company name directly on the recipient).
  const nameMap = new Map<string, string>();
  for (const inv of squareInvoices) {
    if (inv.customer_id && inv.customer_name && !nameMap.has(inv.customer_id)) {
      nameMap.set(inv.customer_id, inv.customer_name);
    }
  }

  // For any subscription customer_ids still missing a name, look up
  // Supabase profiles (which store square_customer_id).
  const missingIds = squareSubs
    .map((s) => s.customer_id)
    .filter((id) => id && !nameMap.has(id));

  if (missingIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("square_customer_id, company_name")
      .in("square_customer_id", missingIds);

    for (const p of profiles ?? []) {
      if (p.square_customer_id && p.company_name) {
        nameMap.set(p.square_customer_id, p.company_name);
      }
    }
  }

  // --- Build the unified recurring list ---

  const recurring: RecurringOrder[] = [];

  // (a) Formal Square Subscriptions (active + paused).
  // PENDING subs with zero amount and no generated invoices are almost
  // always orphans from earlier development testing or from Square's
  // "subscription created but pending cancel" state — hide them rather
  // than surface $0.00/UNKNOWN rows to admins.
  for (const sub of squareSubs) {
    const st = sub.status.toUpperCase();
    if (st !== "ACTIVE" && st !== "PAUSED" && st !== "PENDING") continue;
    if (st === "PENDING" && sub.amount_cents === 0) continue;
    recurring.push({
      id: sub.id,
      customer_name: nameMap.get(sub.customer_id) ?? "Unknown",
      frequency: formatSquareCadence(sub.cadence),
      amount_cents: sub.amount_cents,
      status: sub.status,
      next_date: sub.charged_through_date,
      source: "subscription",
    });
  }

  // (b) Invoice-based recurring patterns — customers who have 3+
  //     invoices but are NOT covered by a formal subscription.
  const subCustomerIds = new Set(squareSubs.map((s) => s.customer_id));
  const invoicesByCustomer = new Map<string, SquareInvoiceSummary[]>();
  for (const inv of squareInvoices) {
    if (!inv.customer_id) continue;
    if (subCustomerIds.has(inv.customer_id)) continue;
    const list = invoicesByCustomer.get(inv.customer_id) ?? [];
    list.push(inv);
    invoicesByCustomer.set(inv.customer_id, list);
  }

  for (const [customerId, invoices] of invoicesByCustomer) {
    if (invoices.length < 3) continue; // 3+ invoices → recurring pattern

    const dates = invoices
      .map((i) => new Date(i.created_at))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    recurring.push({
      id: customerId,
      customer_name:
        invoices[0].customer_name ??
        nameMap.get(customerId) ??
        "Unknown",
      frequency: detectFrequency(dates),
      amount_cents: invoices[0].amount_cents, // most recent
      status: "ACTIVE",
      next_date: null,
      source: "invoice",
      invoice_count: invoices.length,
    });
  }

  // Sort by customer name
  recurring.sort((a, b) => a.customer_name.localeCompare(b.customer_name));

  /* --------------------------------------------------------------- */
  /* 2. Orders — from Supabase (paginated)                           */
  /* --------------------------------------------------------------- */
  const sp = await searchParams;
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const fromIdx = (requestedPage - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  const { data: orders, count } = await supabase
    .from("orders")
    .select("*, profiles(company_name, full_name), order_items(count)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(fromIdx, toIdx);

  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startRow = totalRows === 0 ? 0 : fromIdx + 1;
  const endRow = Math.min(fromIdx + PAGE_SIZE, totalRows);

  /* --------------------------------------------------------------- */
  /* 3. Square-native invoices — invoices that exist in Square but   */
  /*    NOT in Supabase. These originated in Square (Jackie's phone, */
  /*    POS, manual invoice) and are shown read-only here for        */
  /*    visibility. Edits happen in Square.                          */
  /* --------------------------------------------------------------- */
  // Pull tracked invoice ids across ALL orders (not just this page)
  // so we correctly de-dupe — otherwise an order on page 2 with a
  // square_invoice_id would still show up in the Square-only list
  // on page 1.
  const { data: allTrackedIds } = await admin
    .from("orders")
    .select("square_invoice_id")
    .not("square_invoice_id", "is", null);
  const trackedInvoiceIds = new Set(
    (allTrackedIds ?? [])
      .map((r) => r.square_invoice_id)
      .filter((v): v is string => typeof v === "string")
  );
  const squareOnlyInvoices = squareInvoices.filter(
    (inv) => !trackedInvoiceIds.has(inv.id)
  );

  /* --------------------------------------------------------------- */
  /* Render                                                          */
  /* --------------------------------------------------------------- */
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          All Orders
        </h1>
        {totalRows > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing <strong>{startRow}–{endRow}</strong> of{" "}
            <strong>{totalRows.toLocaleString()}</strong>
          </p>
        )}
      </div>

      {/* ---- Recurring Orders (live from Square) ---- */}
      {recurring.length > 0 && (
        <details className="mb-6 border rounded-lg bg-card group" open>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-muted/60 transition-colors rounded-lg text-sm font-medium">
            <Repeat className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {recurring.length} Recurring Order
              {recurring.length !== 1 ? "s" : ""}{" "}
              <span className="text-muted-foreground font-normal">
                (live from Square)
              </span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t">
            {/* Mobile list */}
            <div className="md:hidden divide-y">
              {recurring.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {r.customer_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {r.frequency}
                      </Badge>
                      {statusBadge(r.status)}
                      {r.next_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {format(new Date(r.next_date), "MMM d")}
                        </span>
                      )}
                      {r.source === "invoice" && r.invoice_count && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {r.invoice_count} invoices
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-sm whitespace-nowrap">
                    ${(r.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurring.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.customer_name}
                      </TableCell>
                      <TableCell>{r.frequency}</TableCell>
                      <TableCell className="font-medium">
                        ${(r.amount_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.next_date
                          ? format(new Date(r.next_date), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {r.source === "subscription" ? (
                          <Badge variant="outline" className="text-xs">
                            Subscription
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {r.invoice_count} invoices
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </details>
      )}

      {/* ---- Square-native invoices (not on website) ---- */}
      {squareOnlyInvoices.length > 0 && (
        <details className="mb-6 border rounded-lg bg-card group" open>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-muted/60 transition-colors rounded-lg text-sm font-medium">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {squareOnlyInvoices.length} Square-only invoice
              {squareOnlyInvoices.length !== 1 ? "s" : ""}{" "}
              <span className="text-muted-foreground font-normal">
                (created in Square — edit there)
              </span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t">
            {/* Mobile list */}
            <div className="md:hidden divide-y">
              {squareOnlyInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {inv.customer_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {inv.invoice_number
                        ? `#${inv.invoice_number} · `
                        : ""}
                      {format(new Date(inv.created_at), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {inv.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        From Square
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="font-semibold text-sm whitespace-nowrap">
                      ${(inv.amount_cents / 100).toFixed(2)}
                    </span>
                    {inv.public_url && (
                      <a
                        href={inv.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Square Status</TableHead>
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {squareOnlyInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.invoice_number ? `#${inv.invoice_number}` : "—"}
                      </TableCell>
                      <TableCell>{inv.customer_name ?? "Unknown"}</TableCell>
                      <TableCell>
                        {format(new Date(inv.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(inv.amount_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.public_url ? (
                          <a
                            href={inv.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          >
                            Open in Square
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </details>
      )}

      {/* ---- One-off Orders (from Supabase) ---- */}
      {!orders || orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No orders yet.</p>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => {
              const profile = order.profiles as {
                company_name: string;
                full_name: string;
              };
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block border rounded-lg p-4 bg-card hover:bg-muted/60 active:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">
                        {profile?.company_name ?? "Unknown company"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        #{order.order_number} &middot;{" "}
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                    <span className="text-lg font-bold">
                      ${(order.total_cents / 100).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={
                          ORDER_STATUS_COLORS[order.status as OrderStatus]
                        }
                      >
                        {displayStatusName(order.status)}
                      </Badge>
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {order.order_items?.[0]?.count ?? 0} items
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">
                          {(order.profiles as { company_name: string })
                            ?.company_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(order.profiles as { full_name: string })?.full_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{order.order_items?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="font-medium">
                      ${(order.total_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                      >
                        {displayStatusName(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.payment_status === "paid" ? "default" : "secondary"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Orders pagination"
              className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </p>
              <div className="flex items-center justify-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/admin/orders?page=${currentPage - 1}`}
                    className="px-3 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="px-3 py-2 rounded-md border text-sm text-muted-foreground/50 cursor-not-allowed">
                    ← Previous
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    href={`/admin/orders?page=${currentPage + 1}`}
                    className="px-3 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-3 py-2 rounded-md border text-sm text-muted-foreground/50 cursor-not-allowed">
                    Next →
                  </span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
