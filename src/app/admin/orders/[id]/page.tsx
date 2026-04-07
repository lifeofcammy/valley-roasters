import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_COLORS, ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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
    const newStatus = formData.get("status") as string;
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold">
            Order #{order.order_number}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                      <TableCell className="font-medium">{item.product_name}</TableCell>
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
              <CardTitle>Update Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Select name="status" defaultValue={order.status}>
                    <SelectTrigger>
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
                <Button type="submit">Update Order</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{profile?.company_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.company_phone && (
                <p className="text-sm text-muted-foreground">{profile.company_phone}</p>
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
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order:</span>
                <Badge
                  variant="secondary"
                  className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                  {order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
