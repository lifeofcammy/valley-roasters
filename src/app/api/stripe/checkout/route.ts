import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

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

    // Get profile
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

    // Calculate totals
    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unit_price_cents * item.quantity,
      0
    );
    const totalCents = subtotalCents; // Tax handled by Stripe or added later

    // Create or get Stripe customer
    let stripeCustomerId = profile.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.company_name,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    // Create order in Supabase
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        profile_id: user.id,
        status: "pending",
        subtotal_cents: subtotalCents,
        tax_cents: 0,
        total_cents: totalCents,
        payment_status: "unpaid",
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

    // Create order items
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: validatedItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.product_name} (${item.size})`,
          },
          unit_amount: item.unit_price_cents,
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/orders?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/reorder?checkout=cancelled`,
      metadata: {
        order_id: order.id,
        supabase_user_id: user.id,
      },
    });

    // Update order with Stripe session ID
    await adminSupabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
