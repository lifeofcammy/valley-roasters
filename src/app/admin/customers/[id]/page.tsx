import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="flex items-start gap-3 mb-6 sm:mb-8 flex-wrap">
        <Link href="/admin/customers" className="flex-shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
            {customer.company_name}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {customer.full_name} &middot;{" "}
            <a href={`mailto:${customer.email}`} className="hover:underline">
              {customer.email}
            </a>
          </p>
        </div>
        <Badge
          variant={customer.is_approved ? "default" : "secondary"}
          className="flex-shrink-0"
        >
          {customer.is_approved ? "Approved" : "Pending"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Custom Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePricing} className="space-y-4">
              <div className="space-y-3">
                {productsRes.data?.map((product) => {
                  const custom = pricingMap.get(product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Base: ${(product.base_price_cents / 100).toFixed(2)}
                          /lb
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Label
                          htmlFor={`price_${product.id}`}
                          className="sr-only"
                        >
                          Custom price for {product.name}
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          id={`price_${product.id}`}
                          name={`price_${product.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Base"
                          defaultValue={
                            custom
                              ? (custom.price_cents / 100).toFixed(2)
                              : ""
                          }
                          className="w-24"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Save Pricing
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {!ordersRes.data || ordersRes.data.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet.
              </p>
            ) : (
              <div className="space-y-2">
                {ordersRes.data.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-medium">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          ORDER_STATUS_COLORS[order.status as OrderStatus]
                        }
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Company:</span>
              <span className="break-words">{customer.company_name}</span>

              <span className="text-muted-foreground">Contact:</span>
              <span className="break-words">{customer.full_name}</span>

              <span className="text-muted-foreground">Email:</span>
              <a
                href={`mailto:${customer.email}`}
                className="text-primary hover:underline break-all"
              >
                {customer.email}
              </a>

              <span className="text-muted-foreground">Phone:</span>
              <span>
                {customer.company_phone ? (
                  <a
                    href={`tel:${customer.company_phone}`}
                    className="text-primary hover:underline"
                  >
                    {customer.company_phone}
                  </a>
                ) : (
                  "—"
                )}
              </span>

              <span className="text-muted-foreground">Address:</span>
              <span className="break-words">
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
              <span>
                {format(new Date(customer.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
