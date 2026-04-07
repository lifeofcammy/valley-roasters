import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
import { format } from "date-fns";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(company_name, full_name), order_items(count)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">All Orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No orders yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
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
                    <div>
                      <p className="font-medium">
                        {(order.profiles as { company_name: string })?.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={order.payment_status === "paid" ? "default" : "secondary"}
                    >
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
