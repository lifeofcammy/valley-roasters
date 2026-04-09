import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 See Other — tells the browser to GET the redirect target.
  // Without this, POST→redirect defaults to 307 and the browser
  // re-POSTs to /login, which has no POST handler and errors.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
