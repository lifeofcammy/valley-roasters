import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [customerRes, ordersRes, productsRes, pricingRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("profile_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("customer_pricing").select("*").eq("profile_id", id),
  ]);

  const customer = customerRes.data;
  if (!customer) notFound();

  const pricingMap = new Map(
    pricingRes.data?.map((p) => [p.product_id, p]) ?? []
  );

  async function updatePricing(formData: FormData) {
    "use server";
    const supabase = await createClient();

    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("price_")) continue;
      const productId = key.replace("price_", "");
      const priceCents = Math.round(parseFloat(value as string) * 100);

      if (isNaN(priceCents) || priceCents <= 0) {
        // Remove custom pricing if empty/invalid
        await supabase
          .from("customer_pricing")
          .delete()
          .eq("profile_id", id)
          .eq("product_id", productId);
      } else {
        await supabase.from("customer_pricing").upsert(
          {
            profile_id: id,
            product_id: productId,
            price_cents: priceCents,
          },
          { onConflict: "profile_id,product_id" }
        );
      }
    }

    revalidatePath(`/admin/customers/${id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold">
            {customer.company_name}
          </h1>
          <p className="text-muted-foreground">{customer.full_name} &middot; {customer.email}</p>
        </div>
        <Badge variant={customer.is_approved ? "default" : "secondary"} className="ml-auto">
          {customer.is_approved ? "Approved" : "Pending"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePricing} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Custom Price ($/lb)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsRes.data?.map((product) => {
                    const custom = pricingMap.get(product.id);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          ${(product.base_price_cents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Input
                            name={`price_${product.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Use base"
                            defaultValue={
                              custom ? (custom.price_cents / 100).toFixed(2) : ""
                            }
                            className="w-28"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button type="submit">Save Pricing</Button>
            </form>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {!ordersRes.data || ordersRes.data.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet.
              </p>
            ) : (
              <div className="space-y-3">
                {ordersRes.data.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Company:</span>
              <span>{customer.company_name}</span>
              <span className="text-muted-foreground">Contact:</span>
              <span>{customer.full_name}</span>
              <span className="text-muted-foreground">Email:</span>
              <span>{customer.email}</span>
              <span className="text-muted-foreground">Phone:</span>
              <span>{customer.company_phone || "—"}</span>
              <span className="text-muted-foreground">Address:</span>
              <span>
                {[
                  customer.company_address_line1,
                  customer.company_city,
                  customer.company_state,
                  customer.company_zip,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
              <span className="text-muted-foreground">Joined:</span>
              <span>{format(new Date(customer.created_at), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
