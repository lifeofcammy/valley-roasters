import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchValleyCatalog,
  isSquareConfigured,
} from "@/lib/square/client";

/**
 * Returns a single Square catalog item by its id — used by the reorder
 * page to resolve the ?sku=<id> deep-link from /portal/catalog into a
 * cart pre-fill. We re-use `fetchValleyCatalog` rather than a single-item
 * fetch because the catalog call is already cached for 1 hour (`valley-
 * catalog` tag) so this is effectively free.
 *
 * Auth: portal-only — any signed-in, approved customer can read the
 * catalog. Admin-only would be overkill; the catalog is marketing data.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_approved) {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!isSquareConfigured()) {
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 503 });
  }

  try {
    const items = await fetchValleyCatalog();
    const item = items.find((i) => i.id === id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[portal/catalog-item] fetch failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
