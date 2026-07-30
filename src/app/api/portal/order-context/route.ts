import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveProfile } from "@/lib/impersonate";
import { getOrderHold, orderHoldMessage } from "@/lib/order-hold";
import { alwaysChargesDelivery } from "@/lib/account-pricing";

/**
 * Everything the reorder cart needs to know about *this* buyer before
 * they check out:
 *
 *  - `hold`     whether an outstanding Square invoice blocks new orders
 *  - `delivery` whether the flat fee applies regardless of subtotal
 *
 * Advisory only — `/api/orders` recomputes both server-side before
 * writing anything, so a stale or spoofed response here can't place an
 * order or dodge a delivery fee.
 *
 * Uses the *effective* profile so an admin previewing as a customer sees
 * that customer's rules.
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
    hold: {
      blocked: hold.blocked,
      message: orderHoldMessage(hold),
      invoices: hold.invoices,
      total_cents: hold.total_cents,
    },
    delivery: {
      alwaysCharge: alwaysChargesDelivery(profile.square_customer_id),
    },
  });
}
