import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDisplayStatus } from "@/lib/order-status";
import { RotateCcw, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  fetchCustomerOrders,
  isSquareConfigured,
  moneyToDollars,
  squareStateToStatus,
} from "@/lib/square/client";

type NormalizedOrder = {
  id: string;
  source: "square" | "supabase";
  order_number: string;
  created_at: string;
  total_cents: number;
  status: string;
  payment_status: string;
  square_invoice_status: string | null;
  item_count: number;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

function formatMoney(cents: number | null | undefined): string {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: NormalizedOrder[] = [];
  let loadError: string | null = null;
  let dataSource: "square" | "supabase" = "supabase";

  if (user) {
    // Check if this customer has a linked Square account
    const { data: profile } = await supabase
      .from("profiles")
      .select("square_customer_id")
      .eq("id", user.id)
      .single();

    const squareId = profile?.square_customer_id;

    if (squareId && isSquareConfigured()) {
      // Read order history from Square (source of truth for wholesale)
      try {
        const squareOrders = await fetchCustomerOrders(squareId, 50);
        orders = squareOrders.map((o) => ({
          id: o.id,
          source: "square" as const,
          order_number: o.id.slice(-6).toUpperCase(),
          created_at: o.created_at ?? "",
          total_cents: Math.round(moneyToDollars(o.total_money) * 100),
          status: squareStateToStatus(o.state),
          payment_status:
            (o.tenders?.length ?? 0) > 0 ? "paid" : "unpaid",
          square_invoice_status: null,
          item_count:
            o.line_items?.reduce(
              (sum, li) => sum + (parseFloat(li.quantity ?? "0") || 0),
              0
            ) ?? 0,
        }));
        dataSource = "square";
      } catch (err) {
        // Log the real error for server logs, but show a generic
        // message to the customer — never leak Square API internals.
        console.error("[portal/orders] Square fetch failed:", err);
        loadError =
          "We couldn't load your recent orders. Please refresh in a moment.";
      }
    } else {
      // Fallback: read from Supabase orders table
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, total_cents, created_at, square_invoice_status, order_items(count)"
        )
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[portal/orders] Supabase fetch failed:", error);
        loadError =
          "We couldn't load your recent orders. Please refresh in a moment.";
      } else if (Array.isArray(data)) {
        orders = data.map((o) => ({
          id: String(o.id),
          source: "supabase" as const,
          order_number: String(o.order_number ?? ""),
          created_at: o.created_at ?? "",
          total_cents: o.total_cents ?? 0,
          status: o.status ?? "pending",
          payment_status: o.payment_status ?? "unpaid",
          square_invoice_status: o.square_invoice_status ?? null,
          item_count:
            (o.order_items as { count: number }[] | null)?.[0]?.count ?? 0,
        }));
      }
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Your Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View order history and reorder with one click.
          </p>
          {dataSource === "square" && orders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing live order history from Valley Specialty Roasters
            </p>
          )}
        </div>
        <Link href="/portal/reorder" className="flex-shrink-0">
          <Button className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">We couldn&apos;t load your orders.</p>
            <p className="text-destructive/80 mt-1">{loadError}</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-lg">
          <p className="text-muted-foreground text-lg mb-4">No orders yet.</p>
          <Link href="/portal/reorder">
            <Button>Place Your First Order</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate">
                      Order #{order.order_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                      <span className="text-muted-foreground">
                        {" "}
                        &middot; {order.item_count} lbs
                      </span>
                    </p>
                  </div>
                  <span className="text-lg font-bold flex-shrink-0">
                    {formatMoney(order.total_cents)}
                  </span>
                </div>
                {(() => {
                  const d = getDisplayStatus(order);
                  return (
                    <div className="mt-3">
                      <Badge variant="secondary" className={d.className}>
                        {d.label}
                      </Badge>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link
                    href={`/portal/orders/${encodeURIComponent(order.id)}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link
                    href={`/portal/reorder?from=${encodeURIComponent(order.id)}`}
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full">
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Reorder
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{order.item_count} lbs</TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(order.total_cents)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const d = getDisplayStatus(order);
                        return (
                          <Badge variant="secondary" className={d.className}>
                            {d.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/orders/${encodeURIComponent(order.id)}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link
                          href={`/portal/reorder?from=${encodeURIComponent(order.id)}`}
                        >
                          <Button variant="outline" size="sm">
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Reorder
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
