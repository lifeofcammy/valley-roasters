import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMPERSONATE_COOKIE } from "@/lib/impersonate";

/**
 * POST /api/admin/impersonate
 *
 * Admin starts viewing the portal as a specific customer.
 *
 * Body (either JSON or form-urlencoded):
 *   { targetCustomerId: string }
 *
 * Behavior:
 *  - 401 if not signed in
 *  - 403 if signed-in user is not admin
 *  - 404 if target profile doesn't exist or isn't a customer
 *  - On success: sets the `valley-impersonate` cookie and either:
 *     - Returns 303 redirect to /portal/orders (default for HTML form posts)
 *     - Returns 200 JSON if Accept: application/json was requested
 */
export async function POST(request: Request) {
  // 1. Extract target id from JSON OR form body.
  const contentType = request.headers.get("content-type") ?? "";
  let targetCustomerId: string | null = null;

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { targetCustomerId?: unknown };
      if (typeof body.targetCustomerId === "string") {
        targetCustomerId = body.targetCustomerId;
      }
    } else {
      const form = await request.formData();
      const v = form.get("targetCustomerId");
      if (typeof v === "string") targetCustomerId = v;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Lightweight UUID shape check — keeps obviously bad input out
  // before we hit the database.
  if (
    !targetCustomerId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      targetCustomerId
    )
  ) {
    return NextResponse.json(
      { error: "Missing or invalid targetCustomerId" },
      { status: 400 }
    );
  }

  // 2. Verify the caller is an admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Verify the target exists and is a customer.
  // Use the service-role client because RLS would block the admin
  // from reading another customer's row.
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", targetCustomerId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }
  if (target.role !== "customer") {
    return NextResponse.json(
      { error: "Target is not a customer account" },
      { status: 400 }
    );
  }

  // 4. Set the cookie.
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetCustomerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  // 5. Respond. JSON for API callers, redirect for HTML forms.
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true, targetCustomerId });
  }

  // 303 See Other so the browser GETs the redirect target.
  return NextResponse.redirect(new URL("/portal/orders", request.url), 303);
}
