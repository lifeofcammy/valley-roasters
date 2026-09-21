import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IMPERSONATE_COOKIE } from "@/lib/impersonate";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Drop any "view as customer" cookie with the session, so whoever signs
  // in next on this browser isn't treated as an admin previewing.
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  // 303 See Other — tells the browser to GET the redirect target.
  // Without this, POST→redirect defaults to 307 and the browser
  // re-POSTs to /login, which has no POST handler and errors.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
