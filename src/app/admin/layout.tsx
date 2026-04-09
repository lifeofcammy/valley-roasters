import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, type MobileNavLink } from "@/components/shared/MobileNav";

const adminLinks: MobileNavLink[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/subscriptions", label: "Recurring", icon: "subscriptions" },
  { href: "/admin/messages", label: "Messages", icon: "messages" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/products", label: "Products", icon: "products" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal/orders");

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <MobileNav
        primaryLabel="Admin Panel"
        primaryName={profile?.full_name ?? undefined}
        links={adminLinks}
        extraLink={{
          href: "/portal/orders",
          label: "Customer Portal",
          icon: "back",
        }}
      />

      <main className="flex-1 bg-background min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
