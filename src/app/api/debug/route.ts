import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Diagnostic endpoint — TEMPORARY. Returns the exact error that
 * kills /portal/orders and /admin so we can see it in production.
 * Remove once the auth-page crash is resolved.
 */
export async function GET() {
  const results: Record<string, unknown> = {};

  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      results[name] = await fn();
    } catch (e) {
      const err = e as Error;
      results[name] = {
        error: true,
        message: err?.message ?? String(e),
        name: err?.name,
        stack: err?.stack?.split("\n").slice(0, 8),
      };
    }
  };

  await step("createClient", async () => {
    const s = await createClient();
    return { ok: Boolean(s) };
  });

  let userId: string | null = null;
  await step("getUser", async () => {
    const s = await createClient();
    const { data, error } = await s.auth.getUser();
    if (error) throw error;
    userId = data.user?.id ?? null;
    return { userId, email: data.user?.email };
  });

  if (userId) {
    await step("profile", async () => {
      const s = await createClient();
      const { data, error } = await s
        .from("profiles")
        .select("id, email, role, is_approved, company_name, full_name, square_customer_id")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    });

    await step("orders_query", async () => {
      const s = await createClient();
      const { data, error } = await s
        .from("orders")
        .select(
          "id, order_number, status, payment_status, total_cents, created_at, order_items(count)"
        )
        .eq("profile_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { count: data?.length ?? 0 };
    });
  }

  await step("env_check", async () => ({
    has_supabase_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    has_anon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    has_service: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    service_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    has_square_token: Boolean(process.env.SQUARE_ACCESS_TOKEN),
    square_location: process.env.SQUARE_LOCATION_ID ?? null,
    node_env: process.env.NODE_ENV,
  }));

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
