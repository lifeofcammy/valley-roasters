import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { Package, DollarSign, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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
        .in("status", ["pending", "confirmed"]),
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
      <h1 className="font-display text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {!recentOrdersRes.data || recentOrdersRes.data.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrdersRes.data.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      Order #{order.order_number} &mdash;{" "}
                      {(order.profiles as { company_name: string })?.company_name ?? "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      ${(order.total_cents / 100).toFixed(2)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
