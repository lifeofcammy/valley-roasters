import Link from "next/link";
import Image from "next/image";
import { getEffectiveProfile } from "@/lib/impersonate";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchCoffeeCatalog,
  fetchCustomerOrders,
  isSquareConfigured,
  type SquareCoffeeItem,
} from "@/lib/square/client";
import { Coffee, Plus, Sparkles } from "lucide-react";

/**
 * Wholesale buyer catalog — every coffee SKU Valley currently sells,
 * pulled live from Square via `fetchCoffeeCatalog` (cached 1 hour, tag
 * `valley-catalog`). Items the buyer has ordered before are marked
 * "Previously ordered"; everything else is flagged "New to you" — the
 * whole point of this page per the client is to expose items the
 * wholesaler hasn't tried yet.
 *
 * Clicking "Add to order" deep-links into /portal/reorder?sku=<id>
 * which pre-fills the cart with that SKU at its first variation.
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

  let items: SquareCoffeeItem[] = [];
  try {
    items = await fetchCoffeeCatalog();
  } catch (err) {
    console.error("[portal/catalog] fetch failed:", err);
    return (
      <div className="py-16 text-center text-muted-foreground">
        We couldn&apos;t load the catalog. Please refresh in a moment.
      </div>
    );
  }

  // Build the set of SKU names this buyer has ordered before, so we can
  // surface "New to you" items prominently. We compare by normalized name
  // because Square order line items store the variation name, not the
  // parent item id.
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

  // Also pull the "catalog_highlights" staff-picked list from Supabase
  // for a subtle recommendation badge. Table is optional; if it doesn't
  // exist, we silently skip.
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

  // Sort: new-to-you first, then highlights, then everything else
  // alphabetically. The goal is to help buyers discover SKUs they
  // haven't tried.
  const isOrderedBefore = (item: SquareCoffeeItem): boolean => {
    const lname = item.name.trim().toLowerCase();
    if (orderedNames.has(lname)) return true;
    for (const v of item.variations) {
      const vn = `${item.name} - ${v.name}`.trim().toLowerCase();
      if (orderedNames.has(vn)) return true;
    }
    return false;
  };

  const sorted = [...items].sort((a, b) => {
    const aNew = !isOrderedBefore(a);
    const bNew = !isOrderedBefore(b);
    if (aNew !== bNew) return aNew ? -1 : 1;
    const aHi = highlightIds.has(a.id);
    const bHi = highlightIds.has(b.id);
    if (aHi !== bHi) return aHi ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Coffee Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Every coffee we&apos;re currently roasting. Items you haven&apos;t
          ordered before are up top — click <strong>Add to order</strong> to
          drop one into a new cart.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No coffees available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sorted.map((item) => {
            const orderedBefore = isOrderedBefore(item);
            const highlighted = highlightIds.has(item.id);
            const firstVar = item.variations[0];
            const priceCents = firstVar?.price_cents ?? 0;
            return (
              <Card
                key={item.id}
                className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {item.primary_image_url ? (
                    <Image
                      src={item.primary_image_url}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Coffee className="h-10 w-10" />
                    </div>
                  )}
                  {!orderedBefore && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New to you
                    </Badge>
                  )}
                  {orderedBefore && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2"
                    >
                      Previously ordered
                    </Badge>
                  )}
                  {highlighted && (
                    <Badge className="absolute top-2 right-2 bg-primary/90 hover:bg-primary">
                      Staff pick
                    </Badge>
                  )}
                </div>
                <CardContent className="flex-1 flex flex-col p-4 gap-2">
                  <h3 className="font-semibold text-base truncate">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-end justify-between mt-auto pt-3">
                    <div>
                      {priceCents > 0 ? (
                        <p className="font-bold text-lg">
                          ${(priceCents / 100).toFixed(2)}
                          {firstVar?.name && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              / {firstVar.name}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Contact for price
                        </p>
                      )}
                      {item.variations.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          +{item.variations.length - 1} more size
                          {item.variations.length - 1 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/portal/reorder?sku=${encodeURIComponent(item.id)}`}
                    >
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add to order
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
