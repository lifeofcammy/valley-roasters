import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import {
  fetchOrderForCustomer,
  isSquareConfigured,
  moneyToDollars,
  squareStateToStatus,
} from "@/lib/square/client";

type LineItem = {
  id: string;
  name: string;
  variation_name?: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

type NormalizedOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  notes: string | null;
  items: LineItem[];
};

function formatMoney(cents: number | null | undefined): string {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("square_customer_id")
    .eq("id", user.id)
    .single();

  let order: NormalizedOrder | null = null;

  // Square-backed customer: try Square first, fall through to Supabase.
  // The detail page can be reached with either a Square order id (from
  // /portal/orders list) or a Supabase UUID (from an order just placed
  // in the portal). Rather than crash on the UUID path, try Square,
  // catch the inevitable 404, and then fall into the Supabase branch.
  if (profile?.square_customer_id && isSquareConfigured()) {
    let squareOrder: Awaited<ReturnType<typeof fetchOrderForCustomer>> = null;
    try {
      squareOrder = await fetchOrderForCustomer(id, profile.square_customer_id);
    } catch (err) {
      console.error("[portal/orders/:id] Square fetch failed:", err);
      squareOrder = null;
    }

    if (squareOrder) {
      const subtotal = moneyToDollars(squareOrder.total_money) * 100
        - moneyToDollars(squareOrder.total_tax_money) * 100;

      order = {
        id: squareOrder.id,
        order_number: squareOrder.id.slice(-6).toUpperCase(),
        status: squareStateToStatus(squareOrder.state),
        payment_status:
          (squareOrder.tenders?.length ?? 0) > 0 ? "paid" : "unpaid",
        created_at: squareOrder.created_at ?? "",
        subtotal_cents: Math.round(subtotal),
        tax_cents: Math.round(
          moneyToDollars(squareOrder.total_tax_money) * 100
        ),
        total_cents: Math.round(
          moneyToDollars(squareOrder.total_money) * 100
        ),
        notes: null,
        items:
          squareOrder.line_items?.map((li, idx) => {
            const qty = parseFloat(li.quantity ?? "0") || 0;
            const unit = moneyToDollars(li.base_price_money);
            const total = moneyToDollars(li.total_money || li.gross_sales_money);
            return {
              id: li.uid ?? `line-${idx}`,
              name: li.name ?? "Item",
              variation_name: li.variation_name,
              quantity: qty,
              unit_price_cents: Math.round(unit * 100),
              total_cents: Math.round(total * 100),
            };
          }) ?? [],
      };
    }
  }

  // Supabase fallback — runs when:
  //   - customer is not Square-linked, OR
  //   - the requested id is a Supabase UUID (e.g. a portal-placed order)
  if (!order) {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .eq("profile_id", user.id)
      .single();

    if (!data) notFound();

    type RawItem = {
      id: string;
      product_name: string;
      size: string;
      quantity: number;
      unit_price_cents: number;
      total_cents: number;
    };

    order = {
      id: String(data.id),
      order_number: String(data.order_number ?? ""),
      status: data.status ?? "pending",
      payment_status: data.payment_status ?? "unpaid",
      created_at: data.created_at ?? "",
      subtotal_cents: data.subtotal_cents ?? 0,
      tax_cents: data.tax_cents ?? 0,
      total_cents: data.total_cents ?? 0,
      notes: data.notes ?? null,
      items: ((data.order_items as RawItem[] | null) ?? []).map((it) => ({
        id: String(it.id),
        name: it.product_name,
        variation_name: it.size,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        total_cents: it.total_cents,
      })),
    };
  }

  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Link href="/portal/orders" className="flex-shrink-0">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <Link
          href={`/portal/reorder?from=${encodeURIComponent(order.id)}`}
          className="sm:self-start"
        >
          <Button className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reorder
          </Button>
        </Link>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant="secondary"
              className={`text-sm ${
                ORDER_STATUS_COLORS[order.status as OrderStatus]
              }`}
            >
              {order.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={order.payment_status === "paid" ? "default" : "secondary"}
            >
              {order.payment_status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMoney(order.total_cents)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="border rounded-md p-3 bg-muted/30">
                <p className="font-medium">{item.name}</p>
                {item.variation_name && (
                  <p className="text-sm text-muted-foreground">
                    {item.variation_name}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity} &times; {formatMoney(item.unit_price_cents)}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(item.total_cents)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variation</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.variation_name ?? ""}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.unit_price_cents)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(item.total_cents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t mt-4 pt-4 space-y-1 text-right">
            <p className="text-muted-foreground">
              Subtotal: {formatMoney(order.subtotal_cents)}
            </p>
            {order.tax_cents > 0 && (
              <p className="text-muted-foreground">
                Tax: {formatMoney(order.tax_cents)}
              </p>
            )}
            <p className="text-lg font-bold">
              Total: {formatMoney(order.total_cents)}
            </p>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground break-words">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
