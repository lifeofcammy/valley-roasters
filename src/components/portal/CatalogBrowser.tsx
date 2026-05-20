"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Plus, Search, Sparkles } from "lucide-react";

export interface CatalogItemView {
  id: string;
  name: string;
  description: string | null;
  primary_image_url: string | null;
  category: string | null;
  variations: { id: string; name: string; price_cents: number }[];
  orderedBefore: boolean;
  highlighted: boolean;
}

/**
 * Buyer-facing catalog browser for /portal/catalog.
 *
 * Renders every Valley-location Square item (passed in from the server
 * component) with search + category filtering, modeled loosely on
 * Square's own item library. Each card deep-links into
 * /portal/reorder?sku=<id> so the buyer can add it to an order.
 */
export function CatalogBrowser({ items }: { items: CatalogItemView[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Distinct categories with item counts, alphabetical.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      const c = it.category ?? "Other";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const cat = it.category ?? "Other";
      if (activeCategory !== "All" && cat !== activeCategory) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, activeCategory]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search the catalog…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          className={
            activeCategory === "All"
              ? "px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground"
              : "px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
          }
        >
          All ({items.length})
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={
              activeCategory === cat
                ? "px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground"
                : "px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
            }
          >
            {cat} ({count})
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No items match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((item) => (
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
                {!item.orderedBefore && (
                  <Badge className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New to you
                  </Badge>
                )}
                {item.orderedBefore && (
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    Previously ordered
                  </Badge>
                )}
                {item.highlighted && (
                  <Badge className="absolute top-2 right-2 bg-primary/90 hover:bg-primary">
                    Staff pick
                  </Badge>
                )}
              </div>
              <CardContent className="flex-1 flex flex-col p-4 gap-2">
                {item.category && (
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </span>
                )}
                <h3 className="font-semibold text-base">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-end justify-between mt-auto pt-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-lg">{priceLabel(item)}</p>
                    {item.variations.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {item.variations.length} sizes
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
          ))}
        </div>
      )}
    </div>
  );
}

/** Price label: single price, or a range when an item has multiple sizes. */
function priceLabel(item: CatalogItemView): string {
  const prices = item.variations
    .map((v) => v.price_cents)
    .filter((p) => p > 0);
  if (prices.length === 0) return "Contact for price";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `$${(min / 100).toFixed(2)}`;
  return `$${(min / 100).toFixed(2)} – $${(max / 100).toFixed(2)}`;
}
