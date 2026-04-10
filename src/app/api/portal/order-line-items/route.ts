import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveProfile } from "@/lib/impersonate";
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

  // Use the effective profile so an admin in "view as customer"
  // mode pre-fills the cart from the IMPERSONATED customer's order,
  // not from the admin's own order history.
  const effective = await getEffectiveProfile();
  if (!effective.profile || !effective.userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const profile = effective.profile;
  const effectiveUserId = effective.userId;

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

  // Supabase fallback. Verify the order belongs to the effective
  // customer (RLS would normally do this, but admin client bypasses
  // RLS so we have to scope manually).
  const adminSupabase = createAdminClient();
  const { data: orderRow } = await adminSupabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("profile_id", effectiveUserId)
    .maybeSingle();
  if (!orderRow) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  const { data: rows, error } = await adminSupabase
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
