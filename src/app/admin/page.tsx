import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { Package, DollarSign, Users, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  isSquareConfigured,
  fetchSquareInvoices,
  type SquareInvoiceSummary,
} from "@/lib/square/client";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch stats
  const [ordersRes, customersRes, pendingRes, revenueRes, recentOrdersRes] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer")
        .eq("is_approved", true),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["received", "pending", "confirmed"]),
      supabase
        .from("orders")
        .select("total_cents")
        .eq("payment_status", "paid"),
      supabase
        .from("orders")
        .select("*, profiles(company_name)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const totalRevenue =
    revenueRes.data?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;

  // Also pull Square-native invoices so the "Recent Orders" widget
  // reflects orders Jackie created directly in Square (not via portal).
  // Merged in-memory below; original orders stay editable, Square-only
  // invoices are read-only rows with a link to Square.
  let squareOnlyRecent: SquareInvoiceSummary[] = [];
  try {
    if (isSquareConfigured()) {
      const squareInvoices = await fetchSquareInvoices({ limit: 50 });
      const admin = createAdminClient();
      const { data: tracked } = await admin
        .from("orders")
        .select("square_invoice_id")
        .not("square_invoice_id", "is", null);
      const trackedIds = new Set(
        (tracked ?? [])
          .map((r) => r.square_invoice_id)
          .filter((v): v is string => typeof v === "string")
      );
      squareOnlyRecent = squareInvoices.filter(
        (inv) => !trackedIds.has(inv.id)
      );
    }
  } catch (err) {
    console.error("admin dashboard — Square invoice fetch failed:", err);
  }

  // Build the unified Recent Orders list: Supabase orders + Square-only
  // invoices, sorted by date, trimmed to the 10 most recent.
  type RecentRow =
    | {
        kind: "supabase";
        id: string;
        created_at: string;
        order_number: number;
        company_name: string;
        total_cents: number;
        status: string;
      }
    | {
        kind: "square";
        id: string;
        created_at: string;
        invoice_number: string | null;
        company_name: string;
        total_cents: number;
        status: string;
        public_url: string | null;
      };

  const supabaseRows: RecentRow[] = (recentOrdersRes.data ?? []).map((o) => ({
    kind: "supabase",
    id: o.id,
    created_at: o.created_at,
    order_number: o.order_number,
    company_name:
      (o.profiles as { company_name: string } | null)?.company_name ??
      "Unknown",
    total_cents: o.total_cents,
    status: o.status,
  }));

  const squareRows: RecentRow[] = squareOnlyRecent.map((inv) => ({
    kind: "square",
    id: inv.id,
    created_at: inv.created_at,
    invoice_number: inv.invoice_number,
    company_name: inv.customer_name ?? "Unknown",
    total_cents: inv.amount_cents,
    status: inv.status,
    public_url: inv.public_url,
  }));

  const recentRows = [...supabaseRows, ...squareRows]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  const stats = [
    {
      label: "Total Orders",
      value: ordersRes.count ?? 0,
      icon: Package,
    },
    {
      label: "Revenue",
      value: `$${(totalRevenue / 100).toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Active Customers",
      value: customersRes.count ?? 0,
      icon: Users,
    },
    {
      label: "Pending Orders",
      value: pendingRes.count ?? 0,
      icon: Clock,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline flex-shrink-0"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {recentRows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentRows.map((row) =>
                row.kind === "supabase" ? (
                  <Link
                    key={row.id}
                    href={`/admin/orders/${row.id}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        Order #{row.order_number}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          &mdash; {row.company_name}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {format(new Date(row.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <span className="font-medium">
                        ${(row.total_cents / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          ORDER_STATUS_COLORS[row.status as OrderStatus]
                        }
                      >
                        {row.status}
                      </Badge>
                    </div>
                  </Link>
                ) : (
                  // Square-native invoice — read-only, links to Square
                  <a
                    key={row.id}
                    href={row.public_url ?? "#"}
                    target={row.public_url ? "_blank" : undefined}
                    rel={row.public_url ? "noreferrer" : undefined}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {row.invoice_number
                          ? `Invoice #${row.invoice_number}`
                          : "Square invoice"}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          &mdash; {row.company_name}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {format(new Date(row.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <span className="font-medium">
                        ${(row.total_cents / 100).toFixed(2)}
                      </span>
                      <Badge variant="outline" className="gap-1">
                        From Square
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                    </div>
                  </a>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
