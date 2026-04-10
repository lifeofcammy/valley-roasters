import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEffectiveProfile,
  isImpersonatingFromCookie,
} from "@/lib/impersonate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat, Pause, Play, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface CartLine {
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  size?: string;
}

interface Subscription {
  id: string;
  label: string | null;
  items: CartLine[] | null;
  frequency: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused" | "cancelled";
  next_run_date: string | null;
  created_at: string;
  square_subscription_id: string | null;
}

function formatFrequency(f: string): string {
  if (f === "weekly") return "Every week";
  if (f === "biweekly") return "Every 2 weeks";
  if (f === "monthly") return "Every month";
  return f;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

export default async function SubscriptionsPage() {
  const effective = await getEffectiveProfile();
  if (!effective.profile || !effective.userId) redirect("/login");

  const isImpersonating = effective.isImpersonating;
  const effectiveUserId = effective.userId;

  // Use admin client when impersonating (RLS would otherwise block
  // the admin from reading another customer's subscriptions).
  const reader = createAdminClient();
  const { data: subs } = await reader
    .from("order_subscriptions")
    .select("*")
    .eq("profile_id", effectiveUserId)
    .order("created_at", { ascending: false });

  const list = (subs ?? []) as Subscription[];
  const active = list.filter((s) => s.status === "active");
  const inactive = list.filter((s) => s.status !== "active");

  async function setStatus(formData: FormData) {
    "use server";
    // Defense in depth: refuse all writes while impersonating, even
    // though the UI buttons are also disabled.
    if (await isImpersonatingFromCookie()) return;

    const id = formData.get("id");
    const status = formData.get("status");
    if (typeof id !== "string" || typeof status !== "string") return;
    if (!["active", "paused", "cancelled"].includes(status)) return;

    const supa = await createClient();
    const {
      data: { user: actor },
    } = await supa.auth.getUser();
    if (!actor) return;

    // Load current subscription row (scoped to the caller via RLS).
    const { data: current } = await supa
      .from("order_subscriptions")
      .select("square_subscription_id")
      .eq("id", id)
      .eq("profile_id", actor.id)
      .maybeSingle();

    // If Square has a subscription for this row, drive Square first.
    // CRITICAL: only update our local mirror if Square accepted the
    // change. If Square refuses (e.g. PENDING sub can't be paused),
    // leave the mirror untouched so the two stay in sync. The next
    // page revalidate just shows the unchanged state.
    let squareOk = true;
    if (current?.square_subscription_id) {
      const { isSquareConfigured, pauseSquareSubscription, resumeSquareSubscription, cancelSquareSubscription } = await import("@/lib/square/client");
      if (isSquareConfigured()) {
        try {
          if (status === "paused") {
            await pauseSquareSubscription(current.square_subscription_id);
          } else if (status === "active") {
            await resumeSquareSubscription(current.square_subscription_id);
          } else if (status === "cancelled") {
            await cancelSquareSubscription(current.square_subscription_id);
          }
        } catch (err) {
          squareOk = false;
          console.error("portal setStatus — Square refused:", err);
        }
      }
    }

    if (squareOk) {
      await supa
        .from("order_subscriptions")
        .update({
          status,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("profile_id", actor.id);
    }

    revalidatePath("/portal/subscriptions");
  }

  function renderSub(sub: Subscription) {
    const items = sub.items ?? [];
    const total = items.reduce(
      (sum, it) => sum + (it.unit_price_cents ?? 0) * (it.quantity ?? 0),
      0
    );
    const isActive = sub.status === "active";
    const isPaused = sub.status === "paused";
    const isCancelled = sub.status === "cancelled";

    return (
      <Card
        key={sub.id}
        className={isCancelled ? "opacity-60" : isPaused ? "opacity-80" : ""}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">
                  {sub.label || items[0]?.product_name || "Recurring order"}
                </h3>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="capitalize"
                >
                  {sub.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatFrequency(sub.frequency)}
                {isActive && sub.next_run_date && (
                  <>
                    {" "}
                    · Next run: <strong>{formatDate(sub.next_run_date)}</strong>
                  </>
                )}
              </p>
            </div>
            <span className="text-lg font-bold whitespace-nowrap">
              ${(total / 100).toFixed(2)}
            </span>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 mb-4 space-y-1">
            {items.map((it, i) => (
              <div
                key={i}
                className="text-sm flex justify-between gap-3"
              >
                <span className="text-muted-foreground truncate">
                  {it.quantity}× {it.product_name}
                </span>
                <span>
                  ${((it.unit_price_cents * it.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No items recorded.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {isActive && (
              <form action={setStatus} className="flex-1">
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="status" value="paused" />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isImpersonating}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </form>
            )}
            {isPaused && (
              <form action={setStatus} className="flex-1">
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="status" value="active" />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={isImpersonating}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              </form>
            )}
            {!isCancelled && (
              <form action={setStatus} className="flex-1">
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isImpersonating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </form>
            )}
          </div>
          {isImpersonating && !isCancelled && (
            <p className="text-xs text-muted-foreground mt-2">
              Disabled in admin preview mode
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Repeat className="h-7 w-7 text-primary" />
            Recurring Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule the same order to repeat automatically. Pause or cancel
            anytime.
          </p>
        </div>
        <Link href="/portal/reorder" className="flex-shrink-0">
          <Button>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Repeat className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold">No recurring orders yet</p>
            <p className="text-muted-foreground text-sm mt-2 mb-6">
              When placing an order, check &ldquo;Make this a recurring
              order&rdquo; to schedule automatic repeats.
            </p>
            <Link href="/portal/reorder">
              <Button>Place a New Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Active ({active.length})
              </h2>
              <div className="space-y-4">{active.map(renderSub)}</div>
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Paused / Cancelled ({inactive.length})
              </h2>
              <div className="space-y-4">{inactive.map(renderSub)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
