import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
          })
          .eq("id", orderId);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Find order by payment intent
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (orders && orders.length > 0) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", orders[0].id);
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;

        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("stripe_payment_intent_id", piId);

        if (orders && orders.length > 0) {
          await supabase
            .from("orders")
            .update({ payment_status: "refunded" })
            .eq("id", orders[0].id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
