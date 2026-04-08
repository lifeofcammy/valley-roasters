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

async function squareFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { token } = getConfig();
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // Always server-side; opt out of Next caching for now so
    // the portal reflects Square state in near real time.
    cache: "no-store",
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

/** Helpers to normalize Square money + state for display. */
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
