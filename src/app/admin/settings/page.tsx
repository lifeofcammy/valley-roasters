import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function assertAdmin() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (p?.role !== "admin") throw new Error("Forbidden");
  return user;
}

export default async function AdminSettingsPage() {
  // Admin layout already gates this route, but read-time also loads settings
  const admin = createAdminClient();

  const { data: autoPublishRow } = await admin
    .from("app_settings")
    .select("value, updated_at, updated_by")
    .eq("key", "auto_publish_invoices")
    .maybeSingle();

  const autoPublish = autoPublishRow?.value === true;

  async function setAutoPublish(formData: FormData) {
    "use server";
    const actor = await assertAdmin();
    const target = formData.get("target") === "on";
    const a = createAdminClient();
    await a.from("app_settings").upsert(
      {
        key: "auto_publish_invoices",
        value: target,
        updated_at: new Date().toISOString(),
        updated_by: actor.id,
      },
      { onConflict: "key" }
    );
    revalidatePath("/admin/settings");
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
        Settings
      </h1>
      <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
        Top-level settings that change how the portal behaves.
      </p>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">
                Square Invoice Auto-Send
              </CardTitle>
              <Badge variant={autoPublish ? "default" : "secondary"}>
                {autoPublish ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              When a wholesale customer places an order in the portal, it is
              mirrored into Square as an invoice. This setting controls
              whether that invoice is sent to the customer automatically.
            </p>

            <div className="rounded-md bg-muted/40 p-4 space-y-3">
              <div>
                <p className="font-semibold">OFF (recommended at launch)</p>
                <p className="text-muted-foreground">
                  Invoices are created as <strong>DRAFT</strong> in Square.
                  Nothing is sent to the customer. You review each one in
                  your Square dashboard and click <em>Send</em> manually.
                </p>
              </div>
              <div>
                <p className="font-semibold">ON</p>
                <p className="text-muted-foreground">
                  Invoices are <strong>published</strong> the moment a
                  customer hits Place Order. Square emails the customer a
                  payment link immediately (card + ACH + NET-30 accepted).
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Recommended rollout: leave OFF for the first 2–4 weeks after
              launch so you can catch any unexpected behavior, then flip
              ON when you&apos;re confident every portal order is legitimate.
            </p>

            <form
              action={setAutoPublish}
              className="flex flex-col sm:flex-row gap-2 pt-2"
            >
              {autoPublish ? (
                <>
                  <input type="hidden" name="target" value="off" />
                  <Button type="submit" variant="outline">
                    Turn OFF — keep invoices as drafts
                  </Button>
                </>
              ) : (
                <>
                  <input type="hidden" name="target" value="on" />
                  <Button type="submit">
                    Turn ON — auto-send invoices
                  </Button>
                </>
              )}
            </form>

            {autoPublishRow?.updated_at && (
              <p className="text-xs text-muted-foreground">
                Last changed: {new Date(autoPublishRow.updated_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
