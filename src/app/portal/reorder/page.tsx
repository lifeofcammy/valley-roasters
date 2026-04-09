"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Trash2, Plus, ShoppingCart, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";

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

export default function ReorderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromOrderId = searchParams.get("from");
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [makeRecurring, setMakeRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("biweekly");

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

      setLoading(false);
    }

    loadData();
  }, [fromOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  function addProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        size: product.available_sizes?.[0] ?? "5lb",
        quantity: product.min_order_qty ?? 5,
        unit_price_cents:
          product.effective_price_cents ?? product.base_price_cents,
      },
    ]);
  }

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

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      toast.error("Add items to your cart first.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          recurring: makeRecurring
            ? { frequency, label: cart[0]?.product_name }
            : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (makeRecurring) {
          toast.success(
            `Order placed and saved as a ${frequency} recurring order.`
          );
        } else {
          toast.success("Order placed — we'll be in touch to confirm.");
        }
        if (data.orderId) {
          router.push(`/portal/orders/${data.orderId}?placed=true`);
        } else if (makeRecurring) {
          router.push("/portal/subscriptions");
        } else {
          router.push("/portal/orders");
        }
      } else {
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products
                  .filter((p) => !cart.some((c) => c.product_id === p.id))
                  .map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="justify-between h-auto py-3 px-4"
                      onClick={() => addProduct(product.id)}
                    >
                      <span className="text-left">
                        <span className="font-medium block">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ${(product.effective_price_cents! / 100).toFixed(2)}{" "}
                          / {product.unit ?? "lb"}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
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

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Subtotal</span>
                  <span>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  We&apos;ll confirm pricing, shipping, and payment after you
                  place your order.
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
                disabled={cart.length === 0 || placing}
                onClick={handlePlaceOrder}
              >
                {placing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing...
                  </>
                ) : makeRecurring ? (
                  "Place Order & Schedule"
                ) : (
                  "Place Order"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
