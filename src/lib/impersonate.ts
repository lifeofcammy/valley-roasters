/**
 * Admin "View as customer" impersonation helper.
 *
 * Reads the Supabase session AND the `valley-impersonate` cookie.
 * If the actual logged-in user is an admin, the cookie is set, and
 * the target profile exists, returns the TARGET profile so portal
 * pages render exactly what the customer would see.
 *
 * Security:
 *  - The actual user MUST be admin (re-checked from the database
 *    with the cookie set, so a non-admin holding a stolen cookie
 *    is silently ignored).
 *  - Reads of the target profile use createAdminClient() to bypass
 *    RLS, since the admin's auth.uid is NOT the customer's id.
 *  - Callers MUST refuse all WRITE actions when isImpersonating is
 *    true. The cookie itself never grants write access.
 */
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const IMPERSONATE_COOKIE = "valley-impersonate";

export interface EffectiveProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  is_approved: boolean | null;
  square_customer_id: string | null;
  company_phone: string | null;
  company_address_line1: string | null;
  company_address_line2: string | null;
  company_city: string | null;
  company_state: string | null;
  company_zip: string | null;
  internal_notes: string | null;
  created_at: string | null;
}

export type EffectiveProfileResult =
  | {
      isImpersonating: false;
      profile: EffectiveProfileRow | null;
      userId: string | null;
      actualAdminId: null;
    }
  | {
      isImpersonating: true;
      profile: EffectiveProfileRow;
      userId: string;
      actualAdminId: string;
    };

/**
 * Resolve the EFFECTIVE profile for the current request.
 *
 * - Not logged in:                          -> { isImpersonating: false, profile: null, userId: null }
 * - Logged in, no impersonation cookie:     -> { isImpersonating: false, profile: <self>, userId: <self.id> }
 * - Admin + valid cookie + customer exists: -> { isImpersonating: true,  profile: <target>, userId: <target.id>, actualAdminId }
 * - Cookie set but caller is NOT admin:     -> ignore cookie, return self.
 * - Cookie set but target missing:          -> ignore cookie, return self.
 */
export async function getEffectiveProfile(): Promise<EffectiveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isImpersonating: false,
      profile: null,
      userId: null,
      actualAdminId: null,
    };
  }

  // Read the actual signed-in user's profile via the SSR client.
  // This row is RLS-readable to the user themselves, so no admin
  // client needed for the self-read.
  const { data: selfProfile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, company_name, role, is_approved, square_customer_id, company_phone, company_address_line1, company_address_line2, company_city, company_state, company_zip, internal_notes, created_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  const cookieStore = await cookies();
  const targetId = cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;

  // Fast path — no cookie at all.
  if (!targetId) {
    return {
      isImpersonating: false,
      profile: (selfProfile as EffectiveProfileRow | null) ?? null,
      userId: user.id,
      actualAdminId: null,
    };
  }

  // Cookie set, but only honor it if the actual caller is admin.
  if (selfProfile?.role !== "admin") {
    return {
      isImpersonating: false,
      profile: (selfProfile as EffectiveProfileRow | null) ?? null,
      userId: user.id,
      actualAdminId: null,
    };
  }

  // Use the service-role client to look up the target — RLS would
  // block the admin from reading another customer's row.
  const admin = createAdminClient();
  const { data: targetProfile } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, company_name, role, is_approved, square_customer_id, company_phone, company_address_line1, company_address_line2, company_city, company_state, company_zip, internal_notes, created_at"
    )
    .eq("id", targetId)
    .maybeSingle();

  if (!targetProfile) {
    return {
      isImpersonating: false,
      profile: (selfProfile as EffectiveProfileRow | null) ?? null,
      userId: user.id,
      actualAdminId: null,
    };
  }

  return {
    isImpersonating: true,
    profile: targetProfile as EffectiveProfileRow,
    userId: (targetProfile as EffectiveProfileRow).id,
    actualAdminId: user.id,
  };
}

/**
 * Convenience: returns true iff the impersonate cookie is present.
 * Used by write-side guards (API routes, server actions) that should
 * refuse to mutate while in admin preview mode. Does NOT verify the
 * caller is admin — that check happens elsewhere; the goal here is
 * to refuse writes for ANY session that has the cookie set, which
 * is the safer default.
 */
export async function isImpersonatingFromCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(IMPERSONATE_COOKIE)?.value);
}
