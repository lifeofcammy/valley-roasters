import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveProfile } from "@/lib/impersonate";
import {
  createSquareInvoice,
  createSquareOrder,
  createSquareSubscription,
  createSquareSubscriptionPlan,
  fetchValleyCatalog,
  isSquareConfigured,
  type CreateOrderLineItem,
} from "@/lib/square/client";
import {
  calculateDeliveryFeeCents,
  DELIVERY_FEE_LABEL,
} from "@/lib/constants";
import { getOrderHold, orderHoldMessage } from "@/lib/order-hold";

/* ------------------------------------------------------------- */
/* Zod schema — runtime-validates every field before any write.   */
/* ------------------------------------------------------------- */

const cartItemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  product_name: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  quantity: z.number().int().positive().max(10000),
  unit_price_cents: z.number().int().nonnegative().max(1_000_000),
  // Chosen grind (a Square modifier option). Its upcharge is looked up
  // from Square's catalog server-side — the client never sets it — and
  // goes to Square as a line-item modifier so the invoice itemises it.
  grind: z
    .object({
      id: z.string().max(64),
      name: z.string().max(80),
    })
    .nullable()
    .optional(),
  // How many sizes the item offers in Square. When more than one, the
  // size is written into the Square line-item name so the invoice says
  // "Ethiopia - 5lb", not just "Ethiopia".
  size_count: z.number().int().min(1).max(50).optional(),
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
  client_nonce: z.string().min(8).max(64),
});

type CartItem = z.infer<typeof cartItemSchema>;
/** A cart item after server-side pricing: unit price includes the grind. */
type PricedItem = CartItem & {
  base_price_cents: number;
  grind_price_cents: number;
};
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
    // The order belongs to the EFFECTIVE customer: the signed-in buyer,
    // or — when an admin is in "view as customer" mode — the customer
    // being viewed. That lets staff enter an order on a customer's
    // behalf (a phone order, a test) and have it land under that
    // customer's account and Square record, exactly as if they had
    // placed it themselves.
    const effective = await getEffectiveProfile();
    if (!effective.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const customerId = effective.userId;

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
    const clientNonce = body.client_nonce;

    const profile = effective.profile;

    if (!profile || !profile.is_approved) {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // Idempotency pre-check: if the client re-submits with the same
    // nonce, return the existing order instead of creating a duplicate.
    const { data: existing } = await adminSupabase
      .from("orders")
      .select("id, square_order_id, square_invoice_id, square_invoice_public_url")
      .eq("profile_id", customerId)
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

    // Credit hold — refuse new orders while this buyer has an outstanding
    // Square invoice. Checked after the idempotency lookup so retrying an
    // order that already went through still returns that order instead of
    // being rejected. The portal hides the Place Order button too, but this
    // is the check that actually enforces it.
    const hold = await getOrderHold(profile.square_customer_id);
    if (hold.blocked) {
      return NextResponse.json(
        {
          error: orderHoldMessage(hold),
          code: "OUTSTANDING_INVOICE",
          invoices: hold.invoices,
          total_cents: hold.total_cents,
        },
        { status: 409 }
      );
    }

    // Grind upcharges come from Square, not the request. Every grind
    // option across the catalog has a globally unique modifier id, so one
    // flat map covers every item.
    const grindPriceById = new Map<string, number>();
    if (items.some((it) => it.grind) && isSquareConfigured()) {
      try {
        for (const catalogItem of await fetchValleyCatalog()) {
          for (const g of catalogItem.grind_options) {
            grindPriceById.set(g.id, g.price_cents);
          }
        }
      } catch (err) {
        console.error("grind price lookup failed:", err);
        return NextResponse.json(
          { error: "Could not confirm grind pricing. Please try again." },
          { status: 502 }
        );
      }
    }

    // Validate Supabase-product prices server-side via RPC.
    // Pass-through for Square items (product_id null).
    const validatedItems: PricedItem[] = [];
    for (const item of items) {
      let basePrice = item.unit_price_cents;
      if (item.product_id) {
        const { data: effectivePrice } = await adminSupabase.rpc(
          "get_effective_price",
          { p_profile_id: customerId, p_product_id: item.product_id }
        );
        if (effectivePrice === null || effectivePrice === undefined) {
          return NextResponse.json(
            { error: `Product not found: ${item.product_name}` },
            { status: 400 }
          );
        }
        basePrice = effectivePrice;
      }

      let grindPrice = 0;
      if (item.grind) {
        const known = grindPriceById.get(item.grind.id);
        if (known === undefined) {
          return NextResponse.json(
            {
              error: `The "${item.grind.name}" grind is no longer available for ${item.product_name}. Please re-add the item from the catalog.`,
            },
            { status: 400 }
          );
        }
        grindPrice = known;
      }

      validatedItems.push({
        ...item,
        base_price_cents: basePrice,
        grind_price_cents: grindPrice,
        unit_price_cents: basePrice + grindPrice,
      });
    }

    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unit_price_cents * item.quantity,
      0
    );

    // Delivery fee: $5 flat on orders below $300, or on every order for
    // distant accounts (Sahara, Shaghf Glendale). Computed server-side so
    // the client can't opt out of it.
    const deliveryFeeCents = calculateDeliveryFeeCents(subtotalCents, {
      alwaysCharge: Boolean(profile.always_charge_delivery),
    });
    const totalCents = subtotalCents + deliveryFeeCents;

    // 1. Save order in Supabase. The delivery fee rolls into total_cents;
    //    subtotal_cents stays as the pre-fee amount for clarity.
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        profile_id: customerId,
        status: "received",
        subtotal_cents: subtotalCents,
        tax_cents: 0,
        total_cents: totalCents,
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
        orderError?.code === "23505" ||
        orderError?.message?.includes("client_nonce")
      ) {
        const { data: existing } = await adminSupabase
          .from("orders")
          .select(
            "id, square_order_id, square_invoice_id, square_invoice_public_url"
          )
          .eq("profile_id", customerId)
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
        // Bean price on the row; the grind upcharge lives in `grind` and
        // is already counted in total_cents.
        unit_price_cents: item.base_price_cents,
        total_cents: item.unit_price_cents * item.quantity,
        grind: item.grind
          ? {
              id: item.grind.id,
              name: item.grind.name,
              price_cents: item.grind_price_cents,
            }
          : null,
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

        // Assemble Square line items. Append a "Delivery" line only when
        // the fee applies — orders at/over the free-shipping threshold
        // don't see it at all.
        // The grind goes on as an ad-hoc modifier: Square adds its price
        // to the line and prints it under the item on the invoice, so the
        // base price and the upcharge are both visible to the buyer.
        const squareLineItems: CreateOrderLineItem[] = validatedItems.map(
          (it) => ({
            name:
              (it.size_count ?? 1) > 1
                ? `${it.product_name} - ${it.size}`
                : it.product_name,
            quantity: it.quantity,
            unit_price_cents: it.base_price_cents,
            ...(it.grind
              ? {
                  modifiers: [
                    {
                      name: `Grind: ${it.grind.name}`,
                      price_cents: it.grind_price_cents,
                    },
                  ],
                }
              : {}),
          })
        );
        if (deliveryFeeCents > 0) {
          squareLineItems.push({
            name: DELIVERY_FEE_LABEL,
            quantity: 1,
            unit_price_cents: deliveryFeeCents,
          });
        }

        const created = await createSquareOrder({
          squareCustomerId: profile.square_customer_id,
          idempotencyKey: `portal-order-${order.id}`,
          referenceId: String(order.order_number),
          note: `Valley portal order #${order.order_number}`,
          lineItems: squareLineItems,
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

    // 4. Optional recurring subscription — native Square Subscription.
    //    If the customer is Square-linked AND recurring is requested, we:
    //      a) Create a Catalog SUBSCRIPTION_PLAN with one STATIC-priced
    //         variation (total = subtotalCents).
    //      b) Subscribe the customer to that plan variation.
    //      c) Mirror the Square subscription into our Supabase
    //         order_subscriptions table for fast reads in the portal.
    //    Square runs the schedule internally — no cron needed.
    let subscriptionId: string | null = null;
    let subscriptionError: string | null = null;

    if (recurring && recurring.frequency) {
      let squarePlanId: string | null = null;
      let squarePlanVariationId: string | null = null;
      let squareSubscriptionId: string | null = null;

      if (profile.square_customer_id && isSquareConfigured()) {
        try {
          const plan = await createSquareSubscriptionPlan({
            label:
              recurring.label ??
              `${profile.company_name ?? "Wholesale"} ${recurring.frequency}`,
            frequency: recurring.frequency,
            // Subscription price includes the same delivery fee policy
            // as the one-off order that spawned it — if the first order
            // got charged $5 shipping, so do subsequent ones.
            totalAmountCents: totalCents,
            idempotencyKey: `portal-sub-plan-${order.id}`,
          });
          squarePlanId = plan.square_plan_id;
          squarePlanVariationId = plan.square_plan_variation_id;

          const sub = await createSquareSubscription({
            squareCustomerId: profile.square_customer_id,
            planVariationId: plan.square_plan_variation_id,
            idempotencyKey: `portal-sub-${order.id}`,
            startDate: nextRunDate(recurring.frequency),
          });
          squareSubscriptionId = sub.square_subscription_id;
        } catch (subErr) {
          console.error(
            "Square subscription creation failed:",
            subErr instanceof Error ? subErr.message : String(subErr)
          );
          subscriptionError =
            "Could not schedule automatic repeats in Square — the first order was placed but the recurring schedule was not saved. Please contact Valley.";
        }
      }

      // Save our local mirror row regardless of Square success so the
      // portal UI always has a record. Square IDs are null if Square
      // was unreachable or the customer isn't linked.
      const { data: subRow, error: mirrorError } = await adminSupabase
        .from("order_subscriptions")
        .insert({
          profile_id: customerId,
          label: recurring.label ?? null,
          items: validatedItems,
          frequency: recurring.frequency,
          status: squareSubscriptionId ? "active" : "paused",
          next_run_date: nextRunDate(recurring.frequency),
          square_plan_id: squarePlanId,
          square_plan_variation_id: squarePlanVariationId,
          square_subscription_id: squareSubscriptionId,
          last_synced_at: squareSubscriptionId ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (mirrorError) {
        console.error("order_subscriptions insert failed:", mirrorError);
        if (!subscriptionError) {
          subscriptionError = "Could not save recurring schedule";
        }
      } else if (subRow) {
        subscriptionId = subRow.id;
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
