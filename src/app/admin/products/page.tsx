import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCoffeeCatalog, type SquareCoffeeItem } from "@/lib/square/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type HighlightRow = {
  square_catalog_object_id: string;
  is_featured: boolean;
  sort_order: number;
  marketing_description: string | null;
};

async function assertAdmin() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (p?.role !== "admin") throw new Error("Forbidden");
  return user;
}

function variationsLabel(item: SquareCoffeeItem): string {
  if (!item.variations.length) return "—";
  return item.variations
    .map((v) => {
      const price =
        v.price_cents > 0 ? ` ($${(v.price_cents / 100).toFixed(2)})` : "";
      return `${v.name || "Default"}${price}`;
    })
    .join(", ");
}

export default async function AdminCatalogHighlightsPage() {
  // Layout already gates this route, but keep a defensive check.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal/orders");

  // Pull every coffee SKU from Square (live) and overlay highlights from Supabase.
  let catalog: SquareCoffeeItem[] = [];
  let catalogError: string | null = null;
  try {
    catalog = await fetchCoffeeCatalog();
  } catch (e) {
    catalogError = e instanceof Error ? e.message : String(e);
  }

  const admin = createAdminClient();
  const { data: highlightsData } = await admin
    .from("catalog_highlights")
    .select("square_catalog_object_id, is_featured, sort_order, marketing_description");
  const highlights = (highlightsData ?? []) as HighlightRow[];
  const highlightById = new Map<string, HighlightRow>(
    highlights.map((h) => [h.square_catalog_object_id, h])
  );

  // Sort: featured first (by sort_order), then everything else alphabetically.
  const rows = [...catalog].sort((a, b) => {
    const ha = highlightById.get(a.id);
    const hb = highlightById.get(b.id);
    const fa = ha?.is_featured ? 0 : 1;
    const fb = hb?.is_featured ? 0 : 1;
    if (fa !== fb) return fa - fb;
    if (ha?.is_featured && hb?.is_featured) {
      return (ha.sort_order ?? 0) - (hb.sort_order ?? 0);
    }
    return a.name.localeCompare(b.name);
  });

  async function saveHighlights(formData: FormData) {
    "use server";
    await assertAdmin();

    // Form contains a parallel set of fields per item:
    //   id_<idx>            -> square_catalog_object_id
    //   featured_<idx>      -> "on" if checked, missing otherwise
    //   sort_<idx>          -> integer
    //   marketing_<idx>     -> textarea string (may be empty)
    // We collect rows by parsing the id_* keys, then upsert all of them.
    const idEntries = Array.from(formData.entries()).filter(([k]) =>
      k.startsWith("id_")
    );

    type Upsert = {
      square_catalog_object_id: string;
      is_featured: boolean;
      sort_order: number;
      marketing_description: string | null;
      updated_at: string;
    };
    const updates: Upsert[] = [];
    const now = new Date().toISOString();

    for (const [key, value] of idEntries) {
      const idx = key.slice(3); // strip "id_"
      const id = String(value);
      if (!id) continue;
      const featured = formData.get(`featured_${idx}`) === "on";
      const sortRaw = formData.get(`sort_${idx}`);
      const sortNum =
        typeof sortRaw === "string" && sortRaw.length > 0
          ? parseInt(sortRaw, 10)
          : 0;
      const marketingRaw = formData.get(`marketing_${idx}`);
      const marketing =
        typeof marketingRaw === "string" && marketingRaw.trim().length > 0
          ? marketingRaw.trim()
          : null;

      updates.push({
        square_catalog_object_id: id,
        is_featured: featured,
        sort_order: Number.isFinite(sortNum) ? sortNum : 0,
        marketing_description: marketing,
        updated_at: now,
      });
    }

    if (updates.length === 0) {
      return;
    }

    const a = createAdminClient();
    const { error } = await a
      .from("catalog_highlights")
      .upsert(updates, { onConflict: "square_catalog_object_id" });
    if (error) {
      throw new Error("Failed to save highlights: " + error.message);
    }

    revalidateTag("valley-catalog");
    revalidatePath("/admin/products");
    revalidatePath("/wholesale");
  }

  const featuredCount = rows.filter(
    (r) => highlightById.get(r.id)?.is_featured
  ).length;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Catalog Highlights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {featuredCount} featured of {rows.length} coffee SKUs in your Square
          catalog.
        </p>
      </div>

      {/* Big amber banner explaining the new flow */}
      <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5 sm:p-6 text-amber-950 shadow-sm">
        <p className="font-display text-lg sm:text-xl font-bold mb-2">
          Catalog Highlights
        </p>
        <p className="text-sm sm:text-base leading-relaxed">
          These are your highlights for the public Wholesale page. The actual
          coffee catalog is managed in <strong>Square</strong> — add or remove
          SKUs there and they&apos;ll auto-sync within an hour.
        </p>
        <p className="text-sm sm:text-base leading-relaxed mt-2">
          Use this page to choose which SKUs to feature on{" "}
          <strong>valleyspecialtyroasters.com/wholesale</strong> and to write
          marketing-friendly descriptions that override the Square description.
        </p>
      </div>

      {catalogError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load Square catalog: {catalogError}
        </div>
      )}

      {rows.length === 0 && !catalogError && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No coffee SKUs found in your Square catalog. Add items in Square and
          they&apos;ll appear here within an hour.
        </div>
      )}

      {rows.length > 0 && (
        <form action={saveHighlights} className="space-y-4">
          <div className="flex items-center justify-between gap-3 sticky top-0 bg-background/95 backdrop-blur z-10 py-3 -mx-1 px-1 border-b">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tick the SKUs you want featured on /wholesale, then click Save.
            </p>
            <Button type="submit" size="sm" className="sm:size-default">
              Save All
            </Button>
          </div>

          <div className="space-y-3">
            {rows.map((item, idx) => {
              const highlight = highlightById.get(item.id);
              const isFeatured = highlight?.is_featured ?? false;
              const sortOrder = highlight?.sort_order ?? 0;
              const marketing = highlight?.marketing_description ?? "";
              const fallbackDescription =
                item.description?.trim() ?? "(no description in Square)";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm"
                >
                  <input
                    type="hidden"
                    name={`id_${idx}`}
                    value={item.id}
                  />

                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Image / placeholder */}
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {item.primary_image_url ? (
                        <Image
                          src={item.primary_image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg leading-tight">
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 break-all">
                            {item.id}
                          </p>
                        </div>
                        {isFeatured && (
                          <Badge className="bg-primary text-white">
                            Featured
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium text-foreground">
                          Square description:
                        </span>{" "}
                        {fallbackDescription}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">
                          Variations:
                        </span>{" "}
                        {variationsLabel(item)}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
                        <label className="md:col-span-3 flex items-center gap-2 text-sm select-none">
                          <input
                            type="checkbox"
                            name={`featured_${idx}`}
                            defaultChecked={isFeatured}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          <span className="font-medium">Featured</span>
                        </label>

                        <div className="md:col-span-3">
                          <label
                            htmlFor={`sort_${idx}`}
                            className="block text-xs font-medium text-muted-foreground mb-1"
                          >
                            Sort order
                          </label>
                          <input
                            id={`sort_${idx}`}
                            name={`sort_${idx}`}
                            type="number"
                            inputMode="numeric"
                            defaultValue={sortOrder}
                            className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          />
                        </div>

                        <div className="md:col-span-6">
                          <label
                            htmlFor={`marketing_${idx}`}
                            className="block text-xs font-medium text-muted-foreground mb-1"
                          >
                            Marketing description (overrides Square)
                          </label>
                          <textarea
                            id={`marketing_${idx}`}
                            name={`marketing_${idx}`}
                            defaultValue={marketing}
                            rows={2}
                            placeholder="Optional — leave blank to use the Square description"
                            className="w-full min-h-16 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Save All</Button>
          </div>
        </form>
      )}
    </div>
  );
}
