import { NextResponse } from "next/server";
import { getEffectiveProfile } from "@/lib/impersonate";

/**
 * GET /api/portal/me
 *
 * Returns the EFFECTIVE profile for the current request — the
 * impersonated customer when an admin clicked "View as ...", or the
 * actual signed-in user otherwise.
 *
 * Used by client components in /portal that previously fetched the
 * profile directly via supabase-js (which would otherwise return the
 * admin's own profile during impersonation).
 */
export async function GET() {
  const effective = await getEffectiveProfile();
  if (!effective.profile) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({
    isImpersonating: effective.isImpersonating,
    profile: effective.profile,
  });
}
