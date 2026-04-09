import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchOrderForCustomer,
  isSquareConfigured,
  moneyToDollars,
} from "@/lib/square/client";

/**
 * Fetch line items for a past order so the reorder page can pre-fill
 * the cart. Works for both Square-backed customers (Square order ID)
 * and the legacy Supabase orders flow (UUID).
 *
 * GET /api/portal/order-line-items?id=<orderId>
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Look up profile to know if this customer is Square-backed
  const { data: profile } = await supabase
    .from("profiles")
    .select("square_customer_id")
    .eq("id", user.id)
    .single();

  // Square path
  if (profile?.square_customer_id && isSquareConfigured()) {
    try {
      const order = await fetchOrderForCustomer(
        orderId,
        profile.square_customer_id
      );
      if (!order) {
        return NextResponse.json(
          { error: "order not found" },
          { status: 404 }
        );
      }
      const items = (order.line_items ?? []).map((li, idx) => ({
        id: li.uid ?? `line-${idx}`,
        name: li.name ?? "Item",
        variation: li.variation_name ?? null,
        quantity: parseFloat(li.quantity ?? "0") || 0,
        unit_price_cents: Math.round(moneyToDollars(li.base_price_money) * 100),
      }));
      return NextResponse.json({ source: "square", items });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Square error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // Supabase fallback
  const { data: rows, error } = await supabase
    .from("order_items")
    .select("id, product_name, size, quantity, unit_price_cents")
    .eq("order_id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (rows ?? []).map((r) => ({
    id: String(r.id),
    name: r.product_name,
    variation: r.size ?? null,
    quantity: r.quantity,
    unit_price_cents: r.unit_price_cents,
  }));
  return NextResponse.json({ source: "supabase", items });
}
