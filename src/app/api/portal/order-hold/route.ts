import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveProfile } from "@/lib/impersonate";
import { getOrderHold, orderHoldMessage } from "@/lib/order-hold";

/**
 * Whether the signed-in buyer currently has a credit hold (an outstanding
 * Square invoice). The reorder page calls this on load so it can show the
 * hold up front rather than letting someone build a cart and get rejected
 * at checkout.
 *
 * Advisory only — `/api/orders` re-checks server-side before writing
 * anything, so a stale or spoofed response here can't place an order.
 *
 * Uses the *effective* profile so an admin previewing as a customer sees
 * that customer's hold state.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile } = await getEffectiveProfile();
  if (!profile?.is_approved) {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  const hold = await getOrderHold(profile.square_customer_id);

  return NextResponse.json({
    blocked: hold.blocked,
    message: orderHoldMessage(hold),
    invoices: hold.invoices,
    total_cents: hold.total_cents,
  });
}
