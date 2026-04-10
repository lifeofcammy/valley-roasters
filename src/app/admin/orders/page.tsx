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
import { ChevronRight, Repeat, CalendarClock } from "lucide-react";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

interface ActiveSubscription {
  id: string;
  frequency: "weekly" | "biweekly" | "monthly";
  next_run_date: string | null;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price_cents: number;
  }> | null;
  profiles: { company_name: string } | null;
}

function formatFrequency(f: string): string {
  if (f === "weekly") return "Weekly";
  if (f === "biweekly") return "Every 2 wks";
  if (f === "monthly") return "Monthly";
  return f;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Fetch active recurring subscriptions
  const { data: activeSubscriptions } = await admin
    .from("order_subscriptions")
    .select("id, frequency, next_run_date, items, profiles(company_name)")
    .eq("status", "active")
    .order("next_run_date", { ascending: true });

  const subs = (activeSubscriptions ?? []) as unknown as ActiveSubscription[];

  // Resolve current page from ?page=N (1-indexed). Clamp to >= 1.
  const sp = await searchParams;
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // Range is 0-indexed and inclusive. Page 1 -> rows 0..49.
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

      {/* Active Recurring Subscriptions — compact summary */}
      {subs.length > 0 && (
        <details className="mb-6 border rounded-lg bg-card group">
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-muted/60 transition-colors rounded-lg text-sm font-medium">
            <Repeat className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {subs.length} Active Recurring Order{subs.length !== 1 ? "s" : ""}
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t">
            {/* Mobile list */}
            <div className="md:hidden divide-y">
              {subs.map((sub) => {
                const total = (sub.items ?? []).reduce(
                  (sum, it) => sum + (it.unit_price_cents ?? 0) * (it.quantity ?? 0),
                  0
                );
                return (
                  <Link
                    key={sub.id}
                    href="/admin/subscriptions"
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {sub.profiles?.company_name ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {formatFrequency(sub.frequency)}
                        </Badge>
                        {sub.next_run_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {format(new Date(sub.next_run_date), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm whitespace-nowrap">
                      ${(total / 100).toFixed(2)}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((sub) => {
                    const total = (sub.items ?? []).reduce(
                      (sum, it) =>
                        sum + (it.unit_price_cents ?? 0) * (it.quantity ?? 0),
                      0
                    );
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Link
                            href="/admin/subscriptions"
                            className="font-medium text-primary hover:underline"
                          >
                            {sub.profiles?.company_name ?? "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell>{formatFrequency(sub.frequency)}</TableCell>
                        <TableCell>
                          {sub.next_run_date
                            ? format(new Date(sub.next_run_date), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(total / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-green-600/90 text-white hover:bg-green-600"
                          >
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </details>
      )}

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

          {/* Pagination — Prev / page numbers / Next */}
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
