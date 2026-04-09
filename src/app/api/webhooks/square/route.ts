import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Square webhook receiver.
 *
 * Square POSTs here whenever an invoice we care about changes state.
 * We listen for:
 *   - invoice.payment_made      → mark Supabase order as paid
 *   - invoice.canceled          → mark Supabase order as cancelled
 *
 * Auth: HMAC-SHA256 signature verification. Square signs the message
 * with `SQUARE_WEBHOOK_SIGNATURE_KEY` over (notification_url + raw body)
 * and puts the base64 digest in the `x-square-hmacsha256-signature`
 * header. Any request that fails signature verification is rejected.
 *
 * This endpoint is public by necessity — Square calls it without a
 * session — so signature verification is the ONLY thing keeping
 * attackers from spoofing payment events. Do NOT bypass it.
 */

type SquareInvoiceWebhookPayload = {
  type?: string;
  event_id?: string;
  data?: {
    id?: string; // invoice id
    object?: {
      invoice?: {
        id?: string;
        status?: string;
        order_id?: string;
      };
    };
  };
};

function getNotificationUrl(request: Request): string {
  // Square signs against the exact URL it was configured with in the
  // subscription. We match on the production domain in production and
  // fall back to the request URL elsewhere for preview/local testing.
  const configured = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
  if (configured) return configured;
  // Fallback: reconstruct from request.url
  const u = new URL(request.url);
  return `${u.origin}${u.pathname}`;
}

function verifySquareSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
  notificationUrl: string
): boolean {
  if (!signatureHeader) return false;
  const message = notificationUrl + rawBody;
  const expected = createHmac("sha256", signingKey)
    .update(message)
    .digest("base64");
  // Timing-safe comparison
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const signingKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signingKey) {
    console.error("[square webhook] SQUARE_WEBHOOK_SIGNATURE_KEY is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = getNotificationUrl(request);

  if (!verifySquareSignature(rawBody, sig, signingKey, notificationUrl)) {
    console.warn("[square webhook] signature verification failed", {
      hasSig: Boolean(sig),
      notificationUrl,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: SquareInvoiceWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SquareInvoiceWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.type ?? "";
  const invoice = payload.data?.object?.invoice;
  const invoiceId = invoice?.id ?? payload.data?.id;

  if (!invoiceId) {
    console.warn("[square webhook] payload missing invoice id", payload);
    return NextResponse.json({ ok: true, ignored: "no invoice id" });
  }

  const admin = createAdminClient();

  // Find the matching Supabase order row.
  const { data: order } = await admin
    .from("orders")
    .select("id, status, payment_status")
    .eq("square_invoice_id", invoiceId)
    .maybeSingle();

  if (!order) {
    // Webhook arrived for an invoice we don't track (e.g. created
    // directly in Square, not via the portal). Ack so Square stops
    // retrying.
    console.log(
      `[square webhook] ${eventType} for untracked invoice ${invoiceId}`
    );
    return NextResponse.json({ ok: true, ignored: "untracked invoice" });
  }

  const updates: {
    payment_status?: string;
    status?: string;
    square_invoice_status?: string;
    updated_at?: string;
  } = {};
  const now = new Date().toISOString();
  const invStatus = (invoice?.status ?? "").toUpperCase();

  switch (eventType) {
    case "invoice.payment_made":
      updates.payment_status = "paid";
      updates.square_invoice_status = "PAID";
      updates.updated_at = now;
      break;

    case "invoice.canceled":
    case "invoice.cancelled":
      updates.status = "cancelled";
      updates.square_invoice_status = "CANCELED";
      updates.updated_at = now;
      break;

    case "invoice.created":
    case "invoice.published":
    case "invoice.updated": {
      // Square sends this for many transitions; mirror the useful ones.
      if (invStatus === "PAID") {
        updates.payment_status = "paid";
        updates.square_invoice_status = "PAID";
      } else if (invStatus === "CANCELED") {
        updates.status = "cancelled";
        updates.square_invoice_status = "CANCELED";
      } else if (invStatus === "REFUNDED") {
        updates.payment_status = "refunded";
        updates.square_invoice_status = "REFUNDED";
      } else if (invStatus === "UNPAID" || invStatus === "SCHEDULED") {
        // Invoice has been sent (moved out of DRAFT)
        updates.square_invoice_status = "UNPAID";
      } else if (invStatus === "DRAFT") {
        updates.square_invoice_status = "DRAFT";
      }
      if (Object.keys(updates).length > 0) updates.updated_at = now;
      break;
    }

    default:
      return NextResponse.json({ ok: true, ignored: eventType });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, ignored: "no-op" });
  }

  const { error: updateError } = await admin
    .from("orders")
    .update(updates)
    .eq("id", order.id);

  if (updateError) {
    console.error("[square webhook] order update failed:", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  console.log(
    `[square webhook] ${eventType} → order ${order.id}`,
    updates
  );

  return NextResponse.json({ ok: true, orderId: order.id, updates });
}
