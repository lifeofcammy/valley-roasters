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
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(count)")
    .order("created_at", { ascending: false });

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
        </div>
        <Link href="/portal/reorder" className="flex-shrink-0">
          <Button className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
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
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                      <span className="text-muted-foreground">
                        {" "}
                        &middot; {order.order_items?.[0]?.count ?? 0} items
                      </span>
                    </p>
                  </div>
                  <span className="text-lg font-bold flex-shrink-0">
                    ${(order.total_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                  >
                    {order.status}
                  </Badge>
                  <Badge
                    variant={
                      order.payment_status === "paid" ? "default" : "secondary"
                    }
                  >
                    {order.payment_status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link
                    href={`/portal/orders/${order.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link
                    href={`/portal/reorder?from=${order.id}`}
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
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {order.order_items?.[0]?.count ?? 0} items
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(order.total_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          ORDER_STATUS_COLORS[order.status as OrderStatus]
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/portal/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/portal/reorder?from=${order.id}`}>
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
