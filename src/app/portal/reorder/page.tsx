"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useImpersonation } from "@/components/shared/ImpersonationProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  ShoppingCart,
  Loader2,
  Repeat,
  Truck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateDeliveryFeeCents,
  DELIVERY_FEE_FREE_THRESHOLD_CENTS,
} from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  available_sizes: string[];
  base_price_cents: number;
  min_order_qty: number;
  unit: string;
  effective_price_cents?: number;
}

interface CartItem {
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

type Frequency = "weekly" | "biweekly" | "monthly";

interface OutstandingInvoice {
  id: string;
  invoice_number: string | null;
  amount_cents: number;
  due_date: string | null;
  public_url: string | null;
  is_overdue: boolean;
}

interface OrderHoldState {
  blocked: boolean;
  message: string;
  invoices: OutstandingInvoice[];
  total_cents: number;
}

export default function ReorderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromOrderId = searchParams.get("from");
  // Deep-link from /portal/catalog — pre-fill cart with one SKU.
  // `sku` is the Square catalog item id, `variation` is optional
  // (falls back to "1lb" if missing).
  const skuParam = searchParams.get("sku");
  const supabase = createClient();
  const { isImpersonating } = useImpersonation();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  // Stable per-page-load nonce for order idempotency.
  const [clientNonce] = useState(
    () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2))
  );

  const [makeRecurring, setMakeRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  // Credit hold — set when the buyer has an outstanding Square invoice.
  const [hold, setHold] = useState<OrderHoldState | null>(null);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      // Credit hold check — surfaces an outstanding invoice before the
      // buyer bothers building a cart. Advisory; /api/orders re-checks.
      fetch("/api/portal/order-hold", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((h: OrderHoldState | null) => {
          if (h) setHold(h);
        })
        .catch(() => {
          // Non-fatal — checkout still enforces the hold server-side.
        });

      const { data: pricing } = await supabase
        .from("customer_pricing")
        .select("product_id, price_cents");

      const pricingMap = new Map(
        pricing?.map((p) => [p.product_id, p.price_cents]) ?? []
      );

      const productsWithPricing = (prods ?? []).map((p) => ({
        ...p,
        effective_price_cents: pricingMap.get(p.id) ?? p.base_price_cents,
      }));
      setProducts(productsWithPricing);

      // Pre-fill cart from past order via the unified line-items API
      // (handles both Square-backed and Supabase-backed customers)
      if (fromOrderId) {
        try {
          const res = await fetch(
            `/api/portal/order-line-items?id=${encodeURIComponent(fromOrderId)}`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            const items = (data.items ?? []) as Array<{
              id: string;
              name: string;
              variation: string | null;
              quantity: number;
              unit_price_cents: number;
            }>;
            setCart(
              items.map((it) => ({
                product_id: null,
                product_name: it.name,
                size: it.variation ?? "1lb",
                quantity: it.quantity,
                unit_price_cents: it.unit_price_cents,
              }))
            );
          }
        } catch {
          // Pre-fill is best-effort; user can still build cart manually
        }
      }

      // Deep-link from catalog — pre-fill with one SKU. We fetch the
      // item from Square via the catalog API to resolve its name and
      // first-variation price on the fly.
      if (skuParam && !fromOrderId) {
        try {
          const res = await fetch(
            `/api/portal/catalog-item?id=${encodeURIComponent(skuParam)}`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.item) {
              const item = data.item as {
                name: string;
                variations: Array<{ id: string; name: string; price_cents: number }>;
              };
              const first = item.variations[0];
              if (first) {
                setCart([
                  {
                    product_id: null,
                    product_name: item.name,
                    size: first.name || "1lb",
                    quantity: 1,
                    unit_price_cents: first.price_cents,
                  },
                ]);
              }
            }
          }
        } catch {
          // Best-effort; user can still build cart manually
        }
      }

      setLoading(false);
    }

    loadData();
  }, [fromOrderId, skuParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCartItem(index: number, updates: Partial<CartItem>) {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function removeCartItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  );
  const deliveryFee = calculateDeliveryFeeCents(subtotal);
  const total = subtotal + deliveryFee;
  const remainingForFreeShipping = Math.max(
    0,
    DELIVERY_FEE_FREE_THRESHOLD_CENTS - subtotal
  );

  async function handlePlaceOrder() {
    if (isImpersonating) {
      toast.error("Disabled in admin preview mode.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add items to your cart first.");
      return;
    }
    if (hold?.blocked) {
      toast.error(hold.message);
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          client_nonce: clientNonce,
          recurring: makeRecurring
            ? { frequency, label: cart[0]?.product_name }
            : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (makeRecurring) {
          if (data.subscriptionError) {
            toast.error(
              data.subscriptionError ||
                "Your first order was placed, but the recurring schedule could not be created."
            );
            router.push(
              `/portal/orders/placed?id=${encodeURIComponent(
                data.orderId ?? ""
              )}&scheduleError=1`
            );
          } else {
            toast.success(
              `Order placed and saved as a ${frequency} recurring order.`
            );
            router.push(
              `/portal/subscriptions?placed=${encodeURIComponent(
                data.orderId ?? ""
              )}`
            );
          }
        } else {
          toast.success("Order received — check your email for the invoice.");
          router.push(
            `/portal/orders/placed?id=${encodeURIComponent(data.orderId ?? "")}`
          );
        }
      } else {
        // A hold can appear between page load and checkout (e.g. Jackie
        // sends an invoice while the buyer is building a cart). Surface it
        // in the banner rather than only as a toast.
        if (data.code === "OUTSTANDING_INVOICE") {
          setHold({
            blocked: true,
            message: data.error,
            invoices: data.invoices ?? [],
            total_cents: data.total_cents ?? 0,
          });
        }
        toast.error(data.error || "Could not place order. Please try again.");
        setPlacing(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          {fromOrderId ? "Reorder" : "New Order"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {fromOrderId
            ? "Your previous order has been pre-filled. Adjust quantities as needed."
            : "Select products and quantities to place an order."}
        </p>
      </div>

      {hold?.blocked && (
        <div className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-amber-900 dark:text-amber-100">
                Ordering paused — balance due
              </h2>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-1">
                {hold.message}
              </p>
              <ul className="mt-3 space-y-1.5">
                {hold.invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1"
                  >
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      Invoice {inv.invoice_number ?? inv.id.slice(0, 8)}
                    </span>
                    <span className="text-amber-900/80 dark:text-amber-200/80">
                      ${(inv.amount_cents / 100).toFixed(2)}
                    </span>
                    {inv.due_date && (
                      <span
                        className={
                          inv.is_overdue
                            ? "text-red-700 dark:text-red-400 font-medium"
                            : "text-amber-900/70 dark:text-amber-200/70"
                        }
                      >
                        {inv.is_overdue ? "past due" : "due"} {inv.due_date}
                      </span>
                    )}
                    {inv.public_url && (
                      <a
                        href={inv.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium text-amber-900 dark:text-amber-100 hover:no-underline"
                      >
                        Pay now →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-900/70 dark:text-amber-200/70 mt-3">
                Already paid? Payments can take a few minutes to post — refresh
                this page, or contact us and we&apos;ll sort it out.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No items in your cart. Add products below.
              </CardContent>
            </Card>
          ) : (
            cart.map((item, index) => {
              const product = products.find((p) => p.id === item.product_id);
              const sizeOptions = product?.available_sizes ?? [
                "1lb",
                "5lb",
                "10lb",
              ];
              return (
                <Card key={`${item.product_id ?? item.product_name}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ${(item.unit_price_cents / 100).toFixed(2)} /{" "}
                          {product?.unit ?? "lb"}
                        </p>
                      </div>

                      <Select
                        value={item.size}
                        onValueChange={(v) =>
                          updateCartItem(index, { size: v ?? item.size })
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">
                          Qty:
                        </label>
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(index, {
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>

                      <p className="font-semibold w-24 text-right">
                        $
                        {((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                      </p>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCartItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {cart.length > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Need to change what&apos;s in this order? Contact us and
              we&apos;ll update it.
            </p>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">
                      {item.product_name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      $
                      {((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    Delivery
                  </span>
                  {deliveryFee > 0 ? (
                    <span className="font-medium">
                      ${(deliveryFee / 100).toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      FREE
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                {remainingForFreeShipping > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add{" "}
                    <strong>
                      ${(remainingForFreeShipping / 100).toFixed(2)}
                    </strong>{" "}
                    more for free delivery (orders $
                    {(DELIVERY_FEE_FREE_THRESHOLD_CENTS / 100).toFixed(0)}+
                    ship free).
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    You&apos;ve qualified for free delivery.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  We&apos;ll confirm pricing and payment after you place your
                  order.
                </p>
              </div>

              {/* Recurring order toggle */}
              <div className="border-t pt-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makeRecurring}
                    onChange={(e) => setMakeRecurring(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <Repeat className="h-3.5 w-3.5" />
                      Make this a recurring order
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Auto-repeat the same items on a schedule. You can pause
                      or cancel anytime.
                    </p>
                  </div>
                </label>

                {makeRecurring && (
                  <div className="pl-6">
                    <Select
                      value={frequency}
                      onValueChange={(v) =>
                        setFrequency((v as Frequency) ?? "biweekly")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Every week</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Every month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={
                  cart.length === 0 ||
                  placing ||
                  isImpersonating ||
                  Boolean(hold?.blocked)
                }
                onClick={handlePlaceOrder}
              >
                {placing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing...
                  </>
                ) : hold?.blocked ? (
                  "Balance due"
                ) : makeRecurring ? (
                  "Place Order & Schedule"
                ) : (
                  "Place Order"
                )}
              </Button>
              {hold?.blocked && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                  Settle your outstanding invoice to place a new order
                </p>
              )}
              {isImpersonating && (
                <p className="text-xs text-muted-foreground text-center">
                  Disabled in admin preview mode
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
