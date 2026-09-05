import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPostLoginPath } from "@/lib/auth";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type RefreshedCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let refreshedCookies: RefreshedCookie[] = [];
  let refreshedHeaders: Record<string, string> = {};
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        refreshedCookies = cookiesToSet;
        refreshedHeaders = headers;
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        );
      },
    },
  });

  // Keep this immediately after createServerClient. It validates the JWT and
  // refreshes near-expiry sessions before any authorization decision.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub ?? null;
  const pathname = request.nextUrl.pathname;
  const isPortalRoute = pathname.startsWith("/portal");
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";
  const isPendingRoute = pathname === "/pending-approval";
  const needsAuthorization =
    isPortalRoute || isAdminRoute || isLoginRoute || isPendingRoute;

  function redirectTo(path: string, nextPath?: string) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = path;
    redirectUrl.search = "";
    if (nextPath) redirectUrl.searchParams.set("next", nextPath);

    const response = NextResponse.redirect(redirectUrl);
    refreshedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    Object.entries(refreshedHeaders).forEach(([key, value]) =>
      response.headers.set(key, value)
    );
    return response;
  }

  if (!needsAuthorization) return supabaseResponse;

  if (!userId) {
    if (isPortalRoute || isAdminRoute || isPendingRoute) {
      return redirectTo(
        "/login",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_approved")
    .eq("id", userId)
    .maybeSingle();

  if (isLoginRoute) {
    return redirectTo(getPostLoginPath(profile));
  }

  if (isAdminRoute) {
    if (profile?.role !== "admin") {
      return redirectTo(
        profile?.is_approved ? "/portal/orders" : "/pending-approval"
      );
    }
    return supabaseResponse;
  }

  if (isPortalRoute) {
    const canUsePortal =
      profile?.role === "admin" || Boolean(profile?.is_approved);
    if (!canUsePortal) return redirectTo("/pending-approval");
    return supabaseResponse;
  }

  if (isPendingRoute) {
    if (profile?.role === "admin") return redirectTo("/admin");
    if (profile?.is_approved) return redirectTo("/portal/orders");
  }

  return supabaseResponse;
}
