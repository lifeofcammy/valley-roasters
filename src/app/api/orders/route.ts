import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface CartItem {
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = (await request.json()) as { items: CartItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_approved) {
      return NextResponse.json({ error: "Account not approved" }, { status: 403 });
    }

    // Validate prices server-side using admin client
    const adminSupabase = createAdminClient();
    const validatedItems: CartItem[] = [];

    for (const item of items) {
      const { data: effectivePrice } = await adminSupabase.rpc(
        "get_effective_price",
        { p_profile_id: user.id, p_product_id: item.product_id }
      );

      if (effectivePrice === null || effectivePrice === undefined) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_name}` },
          { status: 400 }
        );
      }

      validatedItems.push({
        ...item,
        unit_price_cents: effectivePrice,
      });
    }

    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unit_price_cents * item.quantity,
      0
    );

    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        profile_id: user.id,
        status: "pending",
        subtotal_cents: subtotalCents,
        tax_cents: 0,
        total_cents: subtotalCents,
        payment_status: "invoice_pending",
        shipping_address_line1: profile.company_address_line1,
        shipping_city: profile.company_city,
        shipping_state: profile.company_state,
        shipping_zip: profile.company_zip,
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    await adminSupabase.from("order_items").insert(
      validatedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        size: item.size,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.unit_price_cents * item.quantity,
      }))
    );

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
