#!/usr/bin/env node
/**
 * Register (or update) the Square webhook subscription for this app.
 *
 * One-time setup: run this once with production env vars loaded and
 * Square will start pushing `invoice.*` and `subscription.*` events
 * to /api/webhooks/square. Without this step, state changes only sync
 * when a customer refreshes the portal (see HANDOFF.md for context).
 *
 * USAGE
 * -----
 *   # Option A — pull production env from Vercel first:
 *   cd ~/GitHub/valley-roasters
 *   npx vercel env pull .env.production.local
 *   node --env-file=.env.production.local scripts/register-square-webhook.mjs
 *
 *   # Option B — you already have the production .env.local locally:
 *   node --env-file=.env.local scripts/register-square-webhook.mjs
 *
 * REQUIRES these env vars
 *   SQUARE_ACCESS_TOKEN              (production token — not sandbox)
 *   SQUARE_ENVIRONMENT               ("production" or "sandbox")
 *   SQUARE_WEBHOOK_NOTIFICATION_URL  (e.g. https://valleyspecialtyroasters.com/api/webhooks/square)
 *
 * OUTPUT
 *   Prints the signature key — paste it into Vercel as
 *   SQUARE_WEBHOOK_SIGNATURE_KEY, then redeploy. The key is shown
 *   ONLY on creation; if you lose it, delete + re-create the subscription.
 */

const EVENT_TYPES = [
  "invoice.created",
  "invoice.published",
  "invoice.updated",
  "invoice.payment_made",
  "invoice.canceled",
  "subscription.updated",
  "subscription.canceled",
];

const SQUARE_VERSION = "2024-10-17";

function baseUrl() {
  return (process.env.SQUARE_ENVIRONMENT ?? "production") === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

async function squareFetch(path, init = {}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN in environment");
  }
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail ?? text;
    throw new Error(`Square ${path} ${res.status}: ${msg}`);
  }
  return json;
}

async function main() {
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
  if (!notificationUrl) {
    throw new Error(
      "Missing SQUARE_WEBHOOK_NOTIFICATION_URL — set it to the public /api/webhooks/square URL"
    );
  }

  console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT ?? "production"}`);
  console.log(`Notification URL: ${notificationUrl}`);

  // 1. Check for an existing subscription pointing at this URL.
  const listRes = await squareFetch("/v2/webhooks/subscriptions");
  const existing = (listRes.subscriptions ?? []).find(
    (s) => s.notification_url === notificationUrl
  );

  if (existing) {
    console.log(
      `\nFound existing subscription ${existing.id} (${existing.name ?? "unnamed"})`
    );
    console.log(`Enabled: ${existing.enabled}`);
    console.log(`Events:  ${(existing.event_types ?? []).join(", ")}`);

    // Check if the event list matches what we want. If not, update.
    const currentSet = new Set(existing.event_types ?? []);
    const needsUpdate =
      EVENT_TYPES.some((e) => !currentSet.has(e)) ||
      [...currentSet].some((e) => !EVENT_TYPES.includes(e));

    if (needsUpdate) {
      console.log("\nUpdating event list to match expected set…");
      await squareFetch(
        `/v2/webhooks/subscriptions/${encodeURIComponent(existing.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            subscription: {
              event_types: EVENT_TYPES,
              enabled: true,
            },
          }),
        }
      );
      console.log("✓ Event list updated");
    } else {
      console.log("\n✓ Subscription already up to date");
    }

    console.log(
      "\nNOTE: Signature keys are only returned on creation. If you don't have\n" +
        "SQUARE_WEBHOOK_SIGNATURE_KEY set in Vercel yet, delete this subscription\n" +
        "from the Square dashboard and re-run this script to get a fresh key."
    );
    return;
  }

  // 2. No match — create a new subscription.
  console.log("\nNo subscription found for this URL. Creating one…");
  const createRes = await squareFetch("/v2/webhooks/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: `valley-portal-${Date.now()}`,
      subscription: {
        name: "Valley Portal — invoice + subscription events",
        notification_url: notificationUrl,
        event_types: EVENT_TYPES,
        api_version: SQUARE_VERSION,
      },
    }),
  });

  const sub = createRes.subscription;
  if (!sub?.id) {
    console.error("Unexpected response:", createRes);
    throw new Error("Square did not return a subscription id");
  }

  console.log(`\n✓ Created subscription ${sub.id}`);
  console.log(`   Events: ${(sub.event_types ?? []).join(", ")}`);

  if (sub.signature_key) {
    console.log("\n════════════════════════════════════════════════════════");
    console.log(" SIGNATURE KEY (save this into Vercel):");
    console.log(` SQUARE_WEBHOOK_SIGNATURE_KEY=${sub.signature_key}`);
    console.log("════════════════════════════════════════════════════════");
    console.log("\nNext steps:");
    console.log("  1. Paste the above into Vercel: Project > Settings > Environment Variables (Production + Preview)");
    console.log("  2. Redeploy so the new env is picked up");
    console.log(
      "  3. In Square Dashboard > Developers > Webhooks, click 'Send test event' for invoice.payment_made"
    );
    console.log(
      "     and confirm /api/webhooks/square returns 200. Untracked invoice IDs ack with"
    );
    console.log(
      '     { "ok": true, "ignored": "untracked invoice" } — that is expected.'
    );
  } else {
    console.warn(
      "\n⚠️  Square did not return a signature_key in the response. You may need to fetch\n" +
        "   it from the Square dev dashboard > Webhooks > [this subscription] > Signature Key."
    );
  }
}

main().catch((err) => {
  console.error("\n✗ Failed:", err.message);
  process.exit(1);
});
