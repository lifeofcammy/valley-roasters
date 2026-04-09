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
