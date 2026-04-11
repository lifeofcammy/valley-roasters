import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Package, Truck } from "lucide-react";

export default async function OrderPlacedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; scheduleError?: string }>;
}) {
  const { id, scheduleError } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the just-placed order so we can show confirmation details
  let orderSummary: {
    order_number: string | null;
    total_cents: number;
    item_count: number;
  } | null = null;

  if (id) {
    const { data } = await supabase
      .from("orders")
      .select("order_number, total_cents, order_items(count)")
      .eq("id", id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (data) {
      orderSummary = {
        order_number: data.order_number ? String(data.order_number) : null,
        total_cents: data.total_cents ?? 0,
        item_count:
          (data.order_items as { count: number }[] | null)?.[0]?.count ?? 0,
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader className="items-center text-center pb-4">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-950 p-3 mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="font-display text-2xl sm:text-3xl">
            Order Received
          </CardTitle>
          {orderSummary ? (
            <p className="text-sm text-muted-foreground mt-2">
              {orderSummary.order_number
                ? `Order #${orderSummary.order_number} · `
                : ""}
              {orderSummary.item_count} item
              {orderSummary.item_count === 1 ? "" : "s"} · $
              {(orderSummary.total_cents / 100).toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Thanks for your order — we&apos;ve got it.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              What happens next
            </h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Our team reviews your order
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    We&apos;ll confirm details within 1 business day.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    You&apos;ll receive an invoice email from Square
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Separate email with a secure payment link. Pay with card or
                    ACH bank transfer. Net-30 terms.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Your order ships within 2–3 business days
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Freshly roasted and on its way.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Heads up:</strong> the invoice
            email may land a few minutes after this confirmation. Keep an eye
            on your inbox (and your spam folder, just in case). Questions?
            Email{" "}
            <a
              href="mailto:info@valleyspecialtyroasters.com"
              className="text-primary hover:underline"
            >
              info@valleyspecialtyroasters.com
            </a>
            .
          </div>

          {scheduleError === "1" && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Recurring schedule not created:</strong> your first order
              was received, but the automatic repeat schedule did not save. If
              you still want recurring deliveries, please contact Valley so we
              can set it up for you.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/portal/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to my orders
              </Button>
            </Link>
            <Link href="/portal/reorder" className="flex-1">
              <Button className="w-full">Place another order</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
