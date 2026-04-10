/**
 * Square API client — server-only. Reads orders and customer data
 * for wholesale customers whose `profiles.square_customer_id` is
 * linked to a real Square customer record.
 *
 * This is intentionally a tiny, direct fetch wrapper — no SDK.
 * Square's REST API is stable and the SDK adds unnecessary weight.
 */

const SQUARE_BASE =
  (process.env.SQUARE_ENVIRONMENT ?? "production") === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const SQUARE_VERSION = "2024-10-17";

function getConfig() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error(
      "Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID."
    );
  }
  return { token, locationId };
}

type SquareFetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

async function squareFetch<T>(
  path: string,
  init?: SquareFetchInit
): Promise<T> {
  const { token } = getConfig();
  // Default to no-store so customer-facing reads are always fresh.
  // Callers can opt into Next.js cache by passing { next: { revalidate: N } }.
  const hasCacheHint = Boolean(init?.next || init?.cache);
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...(hasCacheHint ? {} : { cache: "no-store" as const }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Square API ${res.status} ${res.statusText}: ${text.slice(0, 500)}`
    );
  }

  return (await res.json()) as T;
}



export type SquareMoney = {
  amount?: number;
  currency?: string;
};

export type SquareLineItem = {
  uid?: string;
  name?: string;
  quantity?: string;
  variation_name?: string;
  note?: string;
  base_price_money?: SquareMoney;
  total_money?: SquareMoney;
  gross_sales_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_discount_money?: SquareMoney;
};

export type SquareOrder = {
  id: string;
  location_id?: string;
  state?: string; // OPEN | COMPLETED | CANCELED | DRAFT
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  total_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_discount_money?: SquareMoney;
  total_service_charge_money?: SquareMoney;
  line_items?: SquareLineItem[];
  fulfillments?: Array<{
    uid?: string;
    type?: string;
    state?: string;
    pickup_details?: { recipient?: { display_name?: string } };
    shipment_details?: { recipient?: { display_name?: string } };
  }>;
  tenders?: Array<{
    id?: string;
    type?: string;
    amount_money?: SquareMoney;
    card_details?: { card?: { card_brand?: string; last_4?: string } };
  }>;
  customer_id?: string;
  reference_id?: string;
};

export type SquareCustomer = {
  id: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  reference_id?: string;
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    administrative_district_level_1?: string;
    postal_code?: string;
  };
};

/**
 * Fetch all orders for a given Square customer at Valley's location.
 * Returns newest first.
 */
export async function fetchCustomerOrders(
  squareCustomerId: string,
  limit = 50
): Promise<SquareOrder[]> {
  const { locationId } = getConfig();
  const body = {
    location_ids: [locationId],
    query: {
      filter: {
        customer_filter: { customer_ids: [squareCustomerId] },
      },
      sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
    },
    limit,
  };

  const data = await squareFetch<{ orders?: SquareOrder[] }>(
    "/v2/orders/search",
    { method: "POST", body: JSON.stringify(body) }
  );

  return data.orders ?? [];
}

/**
 * Fetch a single order by its Square order ID. Verifies the order
 * belongs to the given customer — a defensive check so a crafted
 * URL can't leak another customer's order.
 */
export async function fetchOrderForCustomer(
  orderId: string,
  squareCustomerId: string
): Promise<SquareOrder | null> {
  const data = await squareFetch<{ order?: SquareOrder }>(
    `/v2/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" }
  );
  const order = data.order;
  if (!order) return null;
  if (order.customer_id && order.customer_id !== squareCustomerId) {
    return null;
  }
  return order;
}

export async function fetchCustomer(
  squareCustomerId: string
): Promise<SquareCustomer | null> {
  const data = await squareFetch<{ customer?: SquareCustomer }>(
    `/v2/customers/${encodeURIComponent(squareCustomerId)}`,
    { method: "GET" }
  );
  return data.customer ?? null;
}

/* ------------------------------------------------------------- */
/* Top sellers                                                   */
/* ------------------------------------------------------------- */

export type SquareTopItem = {
  name: string;
  qty_lbs: number;
  orders_count: number;
  revenue: number;
  unit_price: number;
};

// Match coffee/bean SKUs and exclude prepared drinks/food.
const COFFEE_KEYWORDS =
  /\b(bean|whole bean|espresso|roast|blend|decaf|drip|coffee)\b/i;
const COFFEE_EXCLUDE =
  /(latte|cappuccino|mocha|cortado|americano|macchiato|cold brew|nitro|iced|burrito|sandwich|cookie|salad|croissant|wrap|bagel)/i;

/**
 * Aggregate Square order line items at Valley's location into a
 * ranked list of top-selling coffee SKUs. Filters out prepared
 * drinks and cafe food (Top Cup runs Valley as a multi-purpose
 * Square location, so the raw order data has both).
 *
 * Cached for 1 hour by default — these stats don't need to be
 * minute-fresh on the marketing homepage.
 */
export async function fetchTopSellingItems(
  limit = 4,
  options: { revalidateSeconds?: number; sampleSize?: number } = {}
): Promise<SquareTopItem[]> {
  const { locationId } = getConfig();
  const body = {
    location_ids: [locationId],
    query: { sort: { sort_field: "CREATED_AT", sort_order: "DESC" } },
    limit: options.sampleSize ?? 500,
  };

  const data = await squareFetch<{ orders?: SquareOrder[] }>(
    "/v2/orders/search",
    {
      method: "POST",
      body: JSON.stringify(body),
      next: { revalidate: options.revalidateSeconds ?? 3600 },
    }
  );

  type Stats = { qty: number; revenue: number; orders: number; unit: number };
  const agg = new Map<string, Stats>();

  for (const order of data.orders ?? []) {
    for (const li of order.line_items ?? []) {
      const name = (li.name ?? "").trim();
      if (!name) continue;
      if (COFFEE_EXCLUDE.test(name)) continue;
      if (!COFFEE_KEYWORDS.test(name)) continue;

      const qty = parseFloat(li.quantity ?? "0") || 0;
      const rev = moneyToDollars(li.total_money);
      const unit = moneyToDollars(li.base_price_money);

      const cur = agg.get(name) ?? { qty: 0, revenue: 0, orders: 0, unit: 0 };
      cur.qty += qty;
      cur.revenue += rev;
      cur.orders += 1;
      if (unit > 0) cur.unit = unit;
      agg.set(name, cur);
    }
  }

  return Array.from(agg.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, limit)
    .map(([name, s]) => ({
      name,
      qty_lbs: Math.round(s.qty),
      orders_count: s.orders,
      revenue: Math.round(s.revenue * 100) / 100,
      unit_price: s.unit,
    }));
}

/* ------------------------------------------------------------- */
/* Coffee catalog (live SKUs from Square)                        */
/* ------------------------------------------------------------- */

/**
 * One variation of a coffee item (e.g. "5 lb bag", "Whole Bean").
 * `price_cents` is the variation's fixed price; 0 if Square has it
 * marked variable-price.
 */
export type SquareCoffeeVariation = {
  id: string;
  name: string;
  price_cents: number;
};

/**
 * A single coffee SKU as it appears in Valley's Square catalog.
 * The id is the Square catalog object id (used as the FK from
 * our `catalog_highlights` table).
 */
export type SquareCoffeeItem = {
  id: string;
  name: string;
  description: string | null;
  primary_image_url: string | null;
  variations: SquareCoffeeVariation[];
};

// Keyword list for the catalog filter — broader than the top-sellers
// filter because here we want to surface ALL coffee SKUs even if their
// names don't include "bean" or "roast" explicitly.
const COFFEE_CATALOG_KEYWORDS =
  /\b(roast|brazil|honduras|guatemala|ethiopia|colombia|sumatra|kenya|decaf|espresso|drip|whole bean|bean|blend|coffee)\b/i;

// Top Cup uses "TC" as a prefix on internal-only SKUs that should
// never show up on Valley's site.
function isTopCupInternal(name: string): boolean {
  return /^tc[\s-]/i.test(name.trim()) || /^tc\d/i.test(name.trim());
}

type SquareCatalogObject = {
  id: string;
  type: string;
  is_deleted?: boolean;
  item_data?: {
    name?: string;
    description?: string;
    description_plaintext?: string;
    image_ids?: string[];
    variations?: Array<{
      id: string;
      type: string;
      item_variation_data?: {
        name?: string;
        price_money?: { amount?: number; currency?: string };
        pricing_type?: string;
      };
    }>;
  };
  image_data?: {
    url?: string;
    name?: string;
  };
};

/**
 * Fetch all coffee items from Valley's Square catalog. Filters to
 * coffee SKUs by name keyword and skips Top Cup internal items.
 *
 * Cached for 1 hour with the `valley-catalog` tag — call
 * `revalidateTag('valley-catalog')` to bust early when needed.
 *
 * Image lookup: `image_ids` only gives us object ids, so we batch
 * the unique ones and fetch them via `/v2/catalog/batch-retrieve`
 * (single round trip). Items without an image return null and the
 * caller should fall back to a placeholder.
 */
export async function fetchCoffeeCatalog(): Promise<SquareCoffeeItem[]> {
  const { locationId } = getConfig();

  // 1. Search the catalog for ITEMs that are enabled at our location.
  // search-catalog-items only returns ITEM-type objects (variations
  // are nested), so this is exactly what we want.
  const searchBody = {
    enabled_location_ids: [locationId],
    limit: 100,
  };

  const allItems: SquareCatalogObject[] = [];
  let cursor: string | undefined;

  do {
    const data = await squareFetch<{
      items?: SquareCatalogObject[];
      cursor?: string;
    }>("/v2/catalog/search-catalog-items", {
      method: "POST",
      body: JSON.stringify(cursor ? { ...searchBody, cursor } : searchBody),
      next: { revalidate: 3600, tags: ["valley-catalog"] },
    });
    if (data.items) allItems.push(...data.items);
    cursor = data.cursor;
  } while (cursor);

  // 2. Filter to coffee items.
  const coffeeItems = allItems.filter((obj) => {
    if (obj.type !== "ITEM") return false;
    if (obj.is_deleted) return false;
    const name = obj.item_data?.name ?? "";
    if (!name) return false;
    if (isTopCupInternal(name)) return false;
    return COFFEE_CATALOG_KEYWORDS.test(name);
  });

  // 3. Collect unique image ids and batch-fetch their URLs in one call.
  const imageIds = new Map<string, string>(); // first image id per item
  const allImageIds = new Set<string>();
  for (const obj of coffeeItems) {
    const ids = obj.item_data?.image_ids ?? [];
    if (ids.length > 0) {
      imageIds.set(obj.id, ids[0]);
      allImageIds.add(ids[0]);
    }
  }

  const imageUrlById = new Map<string, string>();
  if (allImageIds.size > 0) {
    try {
      const data = await squareFetch<{ objects?: SquareCatalogObject[] }>(
        "/v2/catalog/batch-retrieve",
        {
          method: "POST",
          body: JSON.stringify({
            object_ids: Array.from(allImageIds),
            include_related_objects: false,
          }),
          next: { revalidate: 3600, tags: ["valley-catalog"] },
        }
      );
      for (const obj of data.objects ?? []) {
        if (obj.type === "IMAGE" && obj.image_data?.url) {
          imageUrlById.set(obj.id, obj.image_data.url);
        }
      }
    } catch {
      // Image fetches are best-effort; missing images fall back to
      // the placeholder list on the wholesale page.
    }
  }

  // 4. Shape into the public type.
  return coffeeItems.map<SquareCoffeeItem>((obj) => {
    const variations = (obj.item_data?.variations ?? []).map((v) => ({
      id: v.id,
      name: v.item_variation_data?.name ?? "",
      price_cents: v.item_variation_data?.price_money?.amount ?? 0,
    }));

    const firstImageId = imageIds.get(obj.id);
    const primary_image_url = firstImageId
      ? imageUrlById.get(firstImageId) ?? null
      : null;

    return {
      id: obj.id,
      name: obj.item_data?.name ?? "",
      description:
        obj.item_data?.description_plaintext ??
        obj.item_data?.description ??
        null,
      primary_image_url,
      variations,
    };
  });
}

/* ------------------------------------------------------------- */
/* Helpers                                                       */
/* ------------------------------------------------------------- */

/** Normalize Square money to dollars. */
export function moneyToDollars(m?: SquareMoney | null): number {
  if (!m || typeof m.amount !== "number") return 0;
  return m.amount / 100;
}

export function squareStateToStatus(state?: string): string {
  switch ((state ?? "").toUpperCase()) {
    case "COMPLETED":
      return "delivered";
    case "OPEN":
      return "confirmed";
    case "CANCELED":
      return "cancelled";
    case "DRAFT":
      return "pending";
    default:
      return (state ?? "pending").toLowerCase();
  }
}

export function isSquareConfigured(): boolean {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID
  );
}

/* ------------------------------------------------------------- */
/* Writers — create orders + invoices in Square                  */
/* ------------------------------------------------------------- */

export type CreateOrderLineItem = {
  name: string;
  quantity: number;
  unit_price_cents: number;
  note?: string;
};

export type CreatedSquareOrderResult = {
  square_order_id: string;
  total_cents: number;
};

/**
 * Create a Square Order in state=OPEN with the given line items.
 * Idempotency is keyed by a caller-supplied token so retries are safe.
 */
export async function createSquareOrder(args: {
  squareCustomerId: string;
  idempotencyKey: string;
  lineItems: CreateOrderLineItem[];
  referenceId?: string;
  note?: string;
}): Promise<CreatedSquareOrderResult> {
  const { locationId } = getConfig();
  const body = {
    idempotency_key: args.idempotencyKey,
    order: {
      location_id: locationId,
      customer_id: args.squareCustomerId,
      reference_id: args.referenceId,
      line_items: args.lineItems.map((li) => ({
        name: li.name,
        quantity: String(li.quantity),
        base_price_money: {
          amount: Math.round(li.unit_price_cents),
          currency: "USD",
        },
        ...(li.note ? { note: li.note } : {}),
      })),
      state: "OPEN",
      ...(args.note ? { note: args.note } : {}),
    },
  };

  const data = await squareFetch<{ order?: SquareOrder }>("/v2/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!data.order?.id) {
    throw new Error("Square did not return a created order");
  }
  return {
    square_order_id: data.order.id,
    total_cents: data.order.total_money?.amount ?? 0,
  };
}

export type CreatedSquareInvoiceResult = {
  square_invoice_id: string;
  public_url?: string;
  status?: string;
};

/**
 * Create a Square Invoice in DRAFT state, linked to an existing
 * Square Order. The invoice is NOT auto-published — an admin must
 * review and send it from the Square dashboard. This keeps the
 * demo flow safe until Top Cup is ready to auto-send.
 *
 * When you want auto-send later, flip `publish: true`.
 */
export async function createSquareInvoice(args: {
  squareOrderId: string;
  squareCustomerId: string;
  idempotencyKey: string;
  dueDateIso: string; // yyyy-mm-dd
  title?: string;
  publish?: boolean;
}): Promise<CreatedSquareInvoiceResult> {
  const { locationId } = getConfig();

  const body = {
    idempotency_key: args.idempotencyKey,
    invoice: {
      location_id: locationId,
      order_id: args.squareOrderId,
      primary_recipient: { customer_id: args.squareCustomerId },
      payment_requests: [
        {
          request_type: "BALANCE",
          due_date: args.dueDateIso,
        },
      ],
      delivery_method: "EMAIL",
      accepted_payment_methods: {
        card: true,
        bank_account: true,
        buy_now_pay_later: false,
        square_gift_card: false,
      },
      title: args.title ?? "Valley Specialty Roasters Wholesale Invoice",
      description:
        "Thank you for your order. Pay online with card or ACH bank transfer.",
    },
  };

  const data = await squareFetch<{
    invoice?: { id?: string; public_url?: string; status?: string };
  }>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!data.invoice?.id) {
    throw new Error("Square did not return a created invoice");
  }

  // Optionally publish the invoice so Square emails the customer.
  if (args.publish) {
    const pub = await squareFetch<{
      invoice?: { id?: string; public_url?: string; status?: string };
    }>(`/v2/invoices/${encodeURIComponent(data.invoice.id)}/publish`, {
      method: "POST",
      body: JSON.stringify({
        version: 0,
        idempotency_key: `${args.idempotencyKey}-publish`,
      }),
    });
    return {
      square_invoice_id: data.invoice.id,
      public_url: pub.invoice?.public_url ?? data.invoice.public_url,
      status: pub.invoice?.status ?? "UNPAID",
    };
  }

  return {
    square_invoice_id: data.invoice.id,
    public_url: data.invoice.public_url,
    status: data.invoice.status ?? "DRAFT",
  };
}

/* ====================================================================
 * SUBSCRIPTIONS — Square-native recurring orders for wholesale (NET-30)
 * --------------------------------------------------------------------
 * Flow:
 *   1. Create a Catalog SUBSCRIPTION_PLAN object (one per recurring
 *      schedule) with exactly one SUBSCRIPTION_PLAN_VARIATION whose
 *      phase uses STATIC pricing = total amount of the cart.
 *   2. Subscribe the Square customer to that plan variation via
 *      POST /v2/subscriptions. No card on file — Square auto-generates
 *      an invoice for each billing period (which goes through the same
 *      DRAFT/PUBLISHED flow as one-off invoices).
 *   3. Pause / Resume / Cancel from the portal via the *action* endpoints.
 *
 * Why this design: zero cron on our side, zero infrastructure we have
 * to babysit. Square runs the schedule forever. Top Cup sees every
 * recurring wholesaler in their normal Square dashboard.
 * ================================================================== */

export type SubscriptionFrequency = "weekly" | "biweekly" | "monthly";

/** Map our human frequency to Square's Catalog cadence enum. */
function toSquareCadence(f: SubscriptionFrequency): string {
  if (f === "weekly") return "WEEKLY";
  if (f === "biweekly") return "EVERY_TWO_WEEKS";
  return "MONTHLY";
}

export type CreatedSquarePlan = {
  square_plan_id: string;
  square_plan_variation_id: string;
};

/**
 * Create a one-off Catalog SUBSCRIPTION_PLAN + one PLAN_VARIATION with
 * STATIC pricing. The plan name is prefixed with "[Valley Portal]" so
 * Top Cup can filter these out of their manual catalog view.
 */
export async function createSquareSubscriptionPlan(args: {
  label: string;
  frequency: SubscriptionFrequency;
  totalAmountCents: number;
  idempotencyKey: string;
}): Promise<CreatedSquarePlan> {
  // (Square requires SUBSCRIPTION_PLAN to be present at all locations,
  // so we don't need locationId in the body itself.)
  const planName = `[Valley Portal] ${args.label}`;
  const variationName = `${args.frequency} ($${(args.totalAmountCents / 100).toFixed(2)})`;

  // NOTE: Square does NOT allow location-scoping on SUBSCRIPTION_PLAN
  // catalog objects — they must be present at all locations. Trying to
  // pass present_at_location_ids returns INVALID_REQUEST. So we omit
  // both flags and Square defaults present_at_all_locations to true.
  const body = {
    idempotency_key: args.idempotencyKey,
    object: {
      type: "SUBSCRIPTION_PLAN",
      id: "#plan",
      subscription_plan_data: {
        name: planName,
        subscription_plan_variations: [
          {
            type: "SUBSCRIPTION_PLAN_VARIATION",
            id: "#variation",
            subscription_plan_variation_data: {
              name: variationName,
              phases: [
                {
                  cadence: toSquareCadence(args.frequency),
                  ordinal: 0,
                  pricing: {
                    type: "STATIC",
                    price_money: {
                      amount: Math.round(args.totalAmountCents),
                      currency: "USD",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };

  const data = await squareFetch<{
    catalog_object?: {
      id?: string;
      subscription_plan_data?: {
        subscription_plan_variations?: Array<{ id?: string }>;
      };
    };
  }>("/v2/catalog/object", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const planId = data.catalog_object?.id;
  const variationId =
    data.catalog_object?.subscription_plan_data?.subscription_plan_variations?.[0]
      ?.id;
  if (!planId || !variationId) {
    throw new Error("Square did not return a plan + variation id");
  }
  return {
    square_plan_id: planId,
    square_plan_variation_id: variationId,
  };
}

export type CreatedSquareSubscription = {
  square_subscription_id: string;
  status: string;
  charged_through_date?: string;
};

/**
 * Subscribe a Square customer to a plan variation. No card on file —
 * Square will auto-generate an invoice for each billing period.
 *
 * `startDate` must be >= today (yyyy-mm-dd). If omitted, today is used.
 */
export async function createSquareSubscription(args: {
  squareCustomerId: string;
  planVariationId: string;
  idempotencyKey: string;
  startDate?: string;
}): Promise<CreatedSquareSubscription> {
  const { locationId } = getConfig();
  const body = {
    idempotency_key: args.idempotencyKey,
    location_id: locationId,
    plan_variation_id: args.planVariationId,
    customer_id: args.squareCustomerId,
    ...(args.startDate ? { start_date: args.startDate } : {}),
    source: { name: "Valley Portal" },
  };

  const data = await squareFetch<{
    subscription?: {
      id?: string;
      status?: string;
      charged_through_date?: string;
    };
  }>("/v2/subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!data.subscription?.id) {
    throw new Error("Square did not return a created subscription");
  }
  return {
    square_subscription_id: data.subscription.id,
    status: data.subscription.status ?? "ACTIVE",
    charged_through_date: data.subscription.charged_through_date,
  };
}

/** Pause an active subscription. Safe to call on already-paused subs. */
export async function pauseSquareSubscription(
  subscriptionId: string
): Promise<void> {
  await squareFetch(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/pause`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

/** Resume a paused subscription. */
export async function resumeSquareSubscription(
  subscriptionId: string
): Promise<void> {
  await squareFetch(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/resume`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

/**
 * Cancel a subscription. Square marks it CANCELED effective at the end
 * of the current billing period (standard behavior — no partial refunds).
 */
export async function cancelSquareSubscription(
  subscriptionId: string
): Promise<void> {
  await squareFetch(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}
