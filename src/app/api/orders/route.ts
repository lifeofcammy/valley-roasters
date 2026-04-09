import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSquareInvoice,
  createSquareOrder,
  isSquareConfigured,
} from "@/lib/square/client";

/* ------------------------------------------------------------- */
/* Zod schema — runtime-validates every field before any write.   */
/* ------------------------------------------------------------- */

const cartItemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  product_name: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  quantity: z.number().int().positive().max(10000),
  unit_price_cents: z.number().int().nonnegative().max(1_000_000),
});

const recurringSchema = z
  .object({
    frequency: z.enum(["weekly", "biweekly", "monthly"]),
    label: z.string().max(200).optional().nullable(),
  })
  .nullable()
  .optional();

const orderRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  recurring: recurringSchema,
  client_nonce: z.string().min(8).max(64).optional(),
});

type CartItem = z.infer<typeof cartItemSchema>;
type Frequency = "weekly" | "biweekly" | "monthly";

/* ------------------------------------------------------------- */
/* Date helpers (Phoenix time, no DST, month-end clamped)         */
/* ------------------------------------------------------------- */

function formatPhoenixDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function phoenixDatePlusDays(days: number): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + days);
  return formatPhoenixDate(now);
}

/** Add months, clamping to last day of target month (Jan 31 → Feb 28/29). */
function phoenixDatePlusMonths(months: number): string {
  const todayStr = formatPhoenixDate(new Date());
  const [y, m, d] = todayStr.split("-").map((n) => parseInt(n, 10));
  let targetYear = y;
  let targetMonth = m + months;
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${targetYear}-${mm}-${dd}`;
}

function nextRunDate(frequency: Frequency): string {
  if (frequency === "weekly") return phoenixDatePlusDays(7);
  if (frequency === "biweekly") return phoenixDatePlusDays(14);
  return phoenixDatePlusMonths(1);
}

function net30DueDate(): string {
  return phoenixDatePlusDays(30);
}

/* ------------------------------------------------------------- */
/* Settings helper                                                */
/* ------------------------------------------------------------- */

async function getAutoPublishInvoices(): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "auto_publish_invoices")
    .maybeSingle();
  return data?.value === true;
}

/* ------------------------------------------------------------- */
/* POST handler                                                   */
/* ------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse + validate body
    let body: z.infer<typeof orderRequestSchema>;
    try {
      const raw = await request.json();
      body = orderRequestSchema.parse(raw);
    } catch (err) {
      const msg =
        err instanceof z.ZodError
          ? err.issues.map((i) => i.message).join("; ")
          : "Invalid request body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const items = body.items;
    const recurring = body.recurring ?? null;
    const clientNonce = body.client_nonce ?? null;

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

    // Idempotency pre-check: if the client re-submits with the same
    // nonce, return the existing order instead of creating a duplicate.
    if (clientNonce) {
      const { data: existing } = await adminSupabase
        .from("orders")
        .select(
          "id, square_order_id, square_invoice_id, square_invoice_public_url"
        )
        .eq("profile_id", user.id)
        .eq("client_nonce", clientNonce)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({
          orderId: existing.id,
          subscriptionId: null,
          square_order_id: existing.square_order_id,
          square_invoice_id: existing.square_invoice_id,
          square_invoice_public_url: existing.square_invoice_public_url,
          deduped: true,
        });
      }
    }

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

    // 1. Save order in Supabase
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        profile_id: user.id,
        status: "pending",
        subtotal_cents: subtotalCents,
        tax_cents: 0,
        total_cents: subtotalCents,
        payment_status: "unpaid",
        shipping_address_line1: profile.company_address_line1,
        shipping_city: profile.company_city,
        shipping_state: profile.company_state,
        shipping_zip: profile.company_zip,
        client_nonce: clientNonce,
      })
      .select()
      .single();

    if (orderError || !order) {
      // Unique-constraint violation on client_nonce = race with a
      // concurrent duplicate submit. Return the existing order.
      if (
        clientNonce &&
        (orderError?.code === "23505" ||
          orderError?.message?.includes("client_nonce"))
      ) {
        const { data: existing } = await adminSupabase
          .from("orders")
          .select(
            "id, square_order_id, square_invoice_id, square_invoice_public_url"
          )
          .eq("profile_id", user.id)
          .eq("client_nonce", clientNonce)
          .maybeSingle();
        if (existing) {
          return NextResponse.json({
            orderId: existing.id,
            subscriptionId: null,
            square_order_id: existing.square_order_id,
            square_invoice_id: existing.square_invoice_id,
            square_invoice_public_url: existing.square_invoice_public_url,
            deduped: true,
          });
        }
      }
      console.error("orders insert failed:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // 2. Insert line items. On failure, roll back the parent order.
    const { error: itemsError } = await adminSupabase.from("order_items").insert(
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

    if (itemsError) {
      console.error("order_items insert failed:", itemsError);
      await adminSupabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to save order items" },
        { status: 500 }
      );
    }

    // 3. Mirror to Square for Square-linked customers.
    //    Square failures are logged but do NOT fail the request.
    let squareResult: {
      square_order_id?: string;
      square_invoice_id?: string;
      square_invoice_public_url?: string;
      square_invoice_status?: string;
    } = {};

    if (profile.square_customer_id && isSquareConfigured()) {
      try {
        const autoPublish = await getAutoPublishInvoices();

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
          publish: autoPublish,
        });

        squareResult = {
          square_order_id: created.square_order_id,
          square_invoice_id: inv.square_invoice_id,
          square_invoice_public_url: inv.public_url,
          square_invoice_status: (inv.status ?? "DRAFT").toUpperCase(),
        };

        const { error: updateError } = await adminSupabase
          .from("orders")
          .update(squareResult)
          .eq("id", order.id);

        if (updateError) {
          console.error("orders update with square ids failed:", updateError);
        }
      } catch (squareError) {
        console.error(
          "Square order/invoice creation failed:",
          squareError instanceof Error
            ? squareError.message
            : String(squareError)
        );
      }
    }

    // 4. Optional recurring subscription
    let subscriptionId: string | null = null;
    let subscriptionError: string | null = null;
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
      if (subError) {
        console.error("order_subscriptions insert failed:", subError);
        subscriptionError = "Could not save recurring schedule";
      } else if (sub) {
        subscriptionId = sub.id;
      }
    }

    return NextResponse.json({
      orderId: order.id,
      subscriptionId,
      subscriptionError,
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
