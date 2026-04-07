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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/portal/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">
            Order #{order.order_number}
          </h1>
          <p className="text-muted-foreground">
            Placed {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Link href={`/portal/reorder?from=${order.id}`}>
          <Button>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reorder
          </Button>
        </Link>
      </div>

      {/* Status */}
      <div className="flex gap-4 mb-8">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant="secondary"
              className={`text-sm ${ORDER_STATUS_COLORS[order.status as OrderStatus]}`}
            >
              {order.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
              {order.payment_status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(order.total_cents / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items?.map((item: {
                id: string;
                product_name: string;
                size: string;
                quantity: number;
                unit_price_cents: number;
                total_cents: number;
              }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product_name}
                  </TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${(item.unit_price_cents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(item.total_cents / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t mt-4 pt-4 space-y-1 text-right">
            <p className="text-muted-foreground">
              Subtotal: ${(order.subtotal_cents / 100).toFixed(2)}
            </p>
            {order.tax_cents > 0 && (
              <p className="text-muted-foreground">
                Tax: ${(order.tax_cents / 100).toFixed(2)}
              </p>
            )}
            <p className="text-lg font-bold">
              Total: ${(order.total_cents / 100).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
