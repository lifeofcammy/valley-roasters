import { getEffectiveProfile } from "@/lib/impersonate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CatalogBrowser,
  type CatalogItemView,
} from "@/components/portal/CatalogBrowser";
import {
  fetchValleyCatalog,
  fetchCustomerOrders,
  isSquareConfigured,
  type SquareCatalogItem,
} from "@/lib/square/client";

/**
 * Wholesale buyer catalog — every item Valley sells, pulled live from
 * Square via `fetchValleyCatalog` (cached 1 hour, tag `valley-catalog`).
 * Items are filtered to Valley's Square location and exclude Top Cup
 * internal ("TC ___") SKUs.
 *
 * Items the buyer has ordered before are marked "Previously ordered";
 * everything else is flagged "New to you". The CatalogBrowser client
 * component handles search + category filtering. Clicking "Add to order"
 * deep-links into /portal/reorder?sku=<id>.
 */
export default async function CatalogPage() {
  const effective = await getEffectiveProfile();
  const profile = effective.profile;

  if (!isSquareConfigured()) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Catalog is temporarily unavailable.
      </div>
    );
  }

  let items: SquareCatalogItem[] = [];
  try {
    items = await fetchValleyCatalog();
  } catch (err) {
    console.error("[portal/catalog] fetch failed:", err);
    return (
      <div className="py-16 text-center text-muted-foreground">
        We couldn&apos;t load the catalog. Please refresh in a moment.
      </div>
    );
  }

  // Build the set of item names this buyer has ordered before, so we can
  // surface "New to you" items. We compare by normalized name because
  // Square order line items store the variation name, not the item id.
  const orderedNames = new Set<string>();
  const squareId = profile?.square_customer_id;
  if (squareId) {
    try {
      const orders = await fetchCustomerOrders(squareId, 100);
      for (const o of orders) {
        for (const li of o.line_items ?? []) {
          const n = (li.name ?? "").trim().toLowerCase();
          if (n) orderedNames.add(n);
        }
      }
    } catch {
      // Best effort — if this fails we just skip the "previously ordered"
      // badges, rest of the page still works.
    }
  }

  // Staff-picked highlights from Supabase (optional table).
  let highlightIds = new Set<string>();
  try {
    const admin = createAdminClient();
    const { data: highlights } = await admin
      .from("catalog_highlights")
      .select("square_catalog_id");
    highlightIds = new Set(
      (highlights ?? [])
        .map((h) => h.square_catalog_id)
        .filter((v): v is string => Boolean(v))
    );
  } catch {
    // table may not exist — ignore
  }

  const isOrderedBefore = (item: SquareCatalogItem): boolean => {
    const lname = item.name.trim().toLowerCase();
    if (orderedNames.has(lname)) return true;
    for (const v of item.variations) {
      const vn = `${item.name} - ${v.name}`.trim().toLowerCase();
      if (orderedNames.has(vn)) return true;
    }
    return false;
  };

  // Sort: new-to-you first, then highlights, then alphabetical.
  const sorted = [...items].sort((a, b) => {
    const aNew = !isOrderedBefore(a);
    const bNew = !isOrderedBefore(b);
    if (aNew !== bNew) return aNew ? -1 : 1;
    const aHi = highlightIds.has(a.id);
    const bHi = highlightIds.has(b.id);
    if (aHi !== bHi) return aHi ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const views: CatalogItemView[] = sorted.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    primary_image_url: item.primary_image_url,
    category: item.category,
    variations: item.variations,
    orderedBefore: isOrderedBefore(item),
    highlighted: highlightIds.has(item.id),
  }));

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Everything Valley currently offers. Search or filter by category,
          then click <strong>Add to order</strong> to drop an item into a new
          cart. Items you haven&apos;t ordered before are surfaced first.
        </p>
      </div>

      {views.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No items available right now.
        </p>
      ) : (
        <CatalogBrowser items={views} />
      )}
    </div>
  );
}
