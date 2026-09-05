import { NextResponse } from "next/server";
import { getPostLoginPath, safeRedirectPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims.sub;
      const { data: profile } = userId
        ? await supabase
            .from("profiles")
            .select("role, is_approved")
            .eq("id", userId)
            .maybeSingle()
        : { data: null };
      const response = NextResponse.redirect(
        `${origin}${getPostLoginPath(profile, next)}`
      );
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate, max-age=0"
      );
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
