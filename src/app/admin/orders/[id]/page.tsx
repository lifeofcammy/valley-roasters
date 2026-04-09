import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

async function assertAdmin() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") throw new Error("Forbidden");
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), profiles(company_name, full_name, email, company_phone)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  async function updateStatus(formData: FormData) {
    "use server";
    await assertAdmin();
    const ALLOWED = ["pending","confirmed","roasting","shipped","delivered","cancelled"] as const;
    const raw = String(formData.get("status") ?? "");
    if (!(ALLOWED as readonly string[]).includes(raw)) {
      throw new Error("Invalid status");
    }
    const newStatus = raw;
    const adminNotes = formData.get("admin_notes") as string;
    const supabase = await createClient();

    await supabase
      .from("orders")
      .update({
        status: newStatus,
        admin_notes: adminNotes,
      })
      .eq("id", id);

    revalidatePath(`/admin/orders/${id}`);
  }

  const profile = order.profiles as {
    company_name: string;
    full_name: string;
    email: string;
    company_phone: string;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <Link href="/admin/orders" className="flex-shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {order.order_items?.map(
                  (item: {
                    id: string;
                    product_name: string;
                    size: string;
                    quantity: number;
                    unit_price_cents: number;
                    total_cents: number;
                  }) => (
                    <div
                      key={item.id}
                      className="border rounded-md p-3 bg-muted/30"
                    >
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity} &times; $
                          {(item.unit_price_cents / 100).toFixed(2)}
                        </span>
                        <span className="font-semibold">
                          ${(item.total_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
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
                    {order.order_items?.map(
                      (item: {
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
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${(item.unit_price_cents / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.total_cents / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t mt-4 pt-4 text-right">
                <p className="text-lg font-bold">
                  Total: ${(order.total_cents / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Update Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Select name="status" defaultValue={order.status}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    name="admin_notes"
                    defaultValue={order.admin_notes || ""}
                    placeholder="Internal notes about this order..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  Update Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold truncate">{profile?.company_name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground break-all">
                <a href={`mailto:${profile?.email}`} className="hover:underline">
                  {profile?.email}
                </a>
              </p>
              {profile?.company_phone && (
                <p className="text-sm text-muted-foreground">
                  <a
                    href={`tel:${profile.company_phone}`}
                    className="hover:underline"
                  >
                    {profile.company_phone}
                  </a>
                </p>
              )}
              <Link
                href={`/admin/customers/${order.profile_id}`}
                className="text-sm text-primary hover:underline block mt-2"
              >
                View Customer Details
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">Order:</span>
                <Badge
                  variant="secondary"
                  className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <Badge
                  variant={
                    order.payment_status === "paid" ? "default" : "secondary"
                  }
                >
                  {order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {(order.square_invoice_id || order.square_order_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Square Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This order was mirrored into Square as a draft invoice.
                  Review and send it from Square to bill the customer.
                </p>
                {order.square_invoice_public_url && (
                  <a
                    href={order.square_invoice_public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all block"
                  >
                    Open Invoice in Square ↗
                  </a>
                )}
                {order.square_invoice_id && (
                  <p className="text-xs text-muted-foreground break-all">
                    Invoice ID: {order.square_invoice_id}
                  </p>
                )}
                {order.square_order_id && (
                  <p className="text-xs text-muted-foreground break-all">
                    Order ID: {order.square_order_id}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
