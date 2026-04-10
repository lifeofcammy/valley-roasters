import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { revalidatePath } from "next/cache";
import { Repeat, Pause, Play, X } from "lucide-react";
import { format } from "date-fns";

interface CartLine {
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  size?: string;
}

interface SubRow {
  id: string;
  profile_id: string;
  label: string | null;
  items: CartLine[] | null;
  frequency: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused" | "cancelled";
  next_run_date: string | null;
  created_at: string;
  last_run_at: string | null;
  square_subscription_id: string | null;
  profiles: { company_name: string; full_name: string; email: string } | null;
}

function formatFrequency(f: string): string {
  if (f === "weekly") return "Weekly";
  if (f === "biweekly") return "Every 2 wks";
  if (f === "monthly") return "Monthly";
  return f;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_subscriptions")
    .select(
      "id, profile_id, label, items, frequency, status, next_run_date, created_at, last_run_at, square_subscription_id, profiles(company_name, full_name, email)"
    )
    .order("status", { ascending: true })
    .order("next_run_date", { ascending: true });

  const rows = (data ?? []) as unknown as SubRow[];
  const active = rows.filter((r) => r.status === "active");
  const paused = rows.filter((r) => r.status === "paused");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  async function adminSetStatus(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const status = formData.get("status");
    if (typeof id !== "string" || typeof status !== "string") return;
    if (!["active", "paused", "cancelled"].includes(status)) return;

    const supa = await createClient();
    const { data: { user: actor } } = await supa.auth.getUser();
    if (!actor) return;

    // Admin-only
    const { data: actorProfile } = await supa
      .from("profiles")
      .select("role")
      .eq("id", actor.id)
      .maybeSingle();
    if (actorProfile?.role !== "admin") return;

    const { data: current } = await supa
      .from("order_subscriptions")
      .select("square_subscription_id")
      .eq("id", id)
      .maybeSingle();

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
          console.error("admin setStatus — Square refused:", err);
        }
      }
    }

    if (squareOk) {
      await supa
        .from("order_subscriptions")
        .update({ status, updated_at: new Date().toISOString(), last_synced_at: new Date().toISOString() })
        .eq("id", id);
    }

    revalidatePath("/admin/subscriptions");
  }

  function renderCard(s: SubRow) {
    const items = s.items ?? [];
    const total = items.reduce(
      (sum, it) => sum + (it.unit_price_cents ?? 0) * (it.quantity ?? 0),
      0
    );
    return (
      <Card key={s.id}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">
                  {s.profiles?.company_name ?? "Unknown"}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {s.status}
                </Badge>
                <Badge variant="outline">{formatFrequency(s.frequency)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {s.profiles?.full_name} · {s.profiles?.email}
              </p>
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Next run:</span>{" "}
                <strong>{formatDate(s.next_run_date)}</strong>
                {s.last_run_at && (
                  <>
                    {" · "}
                    <span className="text-muted-foreground">Last run:</span>{" "}
                    {formatDate(s.last_run_at)}
                  </>
                )}
              </p>
            </div>
            <span className="text-lg font-bold whitespace-nowrap">
              ${(total / 100).toFixed(2)}
            </span>
          </div>

          {s.status !== "cancelled" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {s.status === "active" && (
                <form action={adminSetStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value="paused" />
                  <Button type="submit" size="sm" variant="outline">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </form>
              )}
              {s.status === "paused" && (
                <form action={adminSetStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value="active" />
                  <Button type="submit" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                </form>
              )}
              <form action={adminSetStatus}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Button type="submit" size="sm" variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </form>
              {s.square_subscription_id && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Native Square subscription · auto-billed
                </span>
              )}
            </div>
          )}

          <div className="mt-4 bg-muted/40 rounded-md p-3 space-y-0.5">
            {items.map((it, i) => (
              <div key={i} className="text-sm flex justify-between gap-3">
                <span className="text-muted-foreground truncate">
                  {it.quantity}× {it.product_name}
                </span>
                <span>
                  ${((it.unit_price_cents * it.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No items recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
        <Repeat className="h-7 w-7 text-primary" />
        Recurring Orders
      </h1>
      <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
        Native Square Subscriptions — recurring invoices are auto-generated
        by Square on each cadence. Pause, resume, or cancel here and the
        change propagates to Square immediately.
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No recurring orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Active ({active.length})
              </h2>
              <div className="space-y-3">{active.map(renderCard)}</div>
            </section>
          )}
          {paused.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Paused ({paused.length})
              </h2>
              <div className="space-y-3">{paused.map(renderCard)}</div>
            </section>
          )}
          {cancelled.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Cancelled ({cancelled.length})
              </h2>
              <div className="space-y-3">{cancelled.map(renderCard)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
