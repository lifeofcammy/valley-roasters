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
import { Trash2, Plus, ShoppingCart, Loader2 } from "lucide-react";
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
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

export default function ReorderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromOrderId = searchParams.get("from");
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load products with effective pricing
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (prods) {
        // Get customer-specific pricing
        const { data: pricing } = await supabase
          .from("customer_pricing")
          .select("product_id, price_cents");

        const pricingMap = new Map(
          pricing?.map((p) => [p.product_id, p.price_cents]) ?? []
        );

        const productsWithPricing = prods.map((p) => ({
          ...p,
          effective_price_cents: pricingMap.get(p.id) ?? p.base_price_cents,
        }));
        setProducts(productsWithPricing);

        // If reordering from a previous order, pre-fill cart
        if (fromOrderId) {
          const { data: order } = await supabase
            .from("order_items")
            .select("product_id, product_name, size, quantity, unit_price_cents")
            .eq("order_id", fromOrderId);

          if (order && order.length > 0) {
            setCart(
              order.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name,
                size: item.size,
                quantity: item.quantity,
                // Use current effective price, not old price
                unit_price_cents:
                  pricingMap.get(item.product_id) ??
                  prods.find((p) => p.id === item.product_id)?.base_price_cents ??
                  item.unit_price_cents,
              }))
            );
          }
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
        unit_price_cents: product.effective_price_cents ?? product.base_price_cents,
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

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Add items to your cart first.");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Checkout failed. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setCheckingOut(false);
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
        {/* Cart Items */}
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
              return (
                <Card key={`${item.product_id}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ${(item.unit_price_cents / 100).toFixed(2)} / {product?.unit ?? "lb"}
                        </p>
                      </div>

                      <Select
                        value={item.size}
                        onValueChange={(v) => updateCartItem(index, { size: v ?? item.size })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {product?.available_sizes?.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Qty:</label>
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
                        ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
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

          {/* Add Product */}
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
                        <span className="font-medium block">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ${(product.effective_price_cents! / 100).toFixed(2)} / {product.unit ?? "lb"}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
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
                      ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
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
                  Tax calculated at checkout
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || checkingOut}
                onClick={handleCheckout}
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
