import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSquareInvoice,
  createSquareOrder,
  isSquareConfigured,
} from "@/lib/square/client";

interface CartItem {
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

type Frequency = "weekly" | "biweekly" | "monthly";

interface OrderRequestBody {
  items: CartItem[];
  recurring?: { frequency: Frequency; label?: string } | null;
}

function nextRunDate(frequency: Frequency): string {
  const d = new Date();
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "biweekly") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function net30DueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as OrderRequestBody;
    const items = body.items;
    const recurring = body.recurring ?? null;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_approved) {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // Validate Supabase-product prices server-side via RPC.
    // Pass-through for Square items (product_id null).
    const validatedItems: CartItem[] = [];
    for (const item of items) {
      if (item.product_id) {
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
        validatedItems.push({ ...item, unit_price_cents: effectivePrice });
      } else {
        validatedItems.push(item);
      }
    }

    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unit_price_cents * item.quantity,
      0
    );

    // 1. Save order in Supabase (system of record for the portal UI)
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
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
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

    // 2. If the customer is linked to Square, mirror the order +
    //    create a DRAFT invoice in Square so Top Cup sees it in
    //    their dashboard alongside POS sales. Invoice is NOT
    //    auto-published — admin reviews and sends from Square.
    let squareResult: {
      square_order_id?: string;
      square_invoice_id?: string;
      square_invoice_public_url?: string;
    } = {};

    if (profile.square_customer_id && isSquareConfigured()) {
      try {
        const created = await createSquareOrder({
          squareCustomerId: profile.square_customer_id,
          idempotencyKey: `portal-order-${order.id}`,
          referenceId: String(order.order_number),
          note: `Valley portal order #${order.order_number}`,
          lineItems: validatedItems.map((it) => ({
            name: it.product_name,
            quantity: it.quantity,
            unit_price_cents: it.unit_price_cents,
          })),
        });

        const inv = await createSquareInvoice({
          squareOrderId: created.square_order_id,
          squareCustomerId: profile.square_customer_id,
          idempotencyKey: `portal-invoice-${order.id}`,
          dueDateIso: net30DueDate(),
          title: `Valley Order #${order.order_number}`,
          publish: false, // admin reviews in Square dashboard before sending
        });

        squareResult = {
          square_order_id: created.square_order_id,
          square_invoice_id: inv.square_invoice_id,
          square_invoice_public_url: inv.public_url,
        };

        await adminSupabase
          .from("orders")
          .update(squareResult)
          .eq("id", order.id);
      } catch (squareError) {
        // Square failure must NOT block the order — the Supabase
        // row is still valid and admin can create the invoice
        // manually. Log it for visibility.
        console.error(
          "Square order/invoice creation failed:",
          squareError instanceof Error
            ? squareError.message
            : String(squareError)
        );
      }
    }

    // 3. Optional recurring subscription
    let subscriptionId: string | null = null;
    if (recurring && recurring.frequency) {
      const { data: sub, error: subError } = await adminSupabase
        .from("order_subscriptions")
        .insert({
          profile_id: user.id,
          label: recurring.label ?? null,
          items: validatedItems,
          frequency: recurring.frequency,
          status: "active",
          next_run_date: nextRunDate(recurring.frequency),
        })
        .select()
        .single();
      if (!subError && sub) {
        subscriptionId = sub.id;
      }
    }

    return NextResponse.json({
      orderId: order.id,
      subscriptionId,
      ...squareResult,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
