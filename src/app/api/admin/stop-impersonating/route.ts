import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IMPERSONATE_COOKIE } from "@/lib/impersonate";

/**
 * POST /api/admin/stop-impersonating
 *
 * Clears the impersonation cookie and sends the admin back to the
 * customers list. Idempotent — safe to POST even if no cookie set.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  // Setting maxAge: 0 expires the cookie immediately on the client.
  cookieStore.set(IMPERSONATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/admin/customers", request.url), 303);
}
