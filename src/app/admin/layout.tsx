import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { LayoutDashboard, Package, Users, Coffee, LogOut, ArrowLeft } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Coffee },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal/orders");

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <aside className="w-full sm:w-64 bg-foreground text-background flex-shrink-0">
        <div className="p-4 border-b border-background/10">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Valley Specialty Roasters" width={36} height={36} className="rounded-full" />
            <span className="font-display font-bold text-sm text-background leading-tight">Valley Specialty<br/>Roasters</span>
          </Link>
        </div>
        <div className="p-4 border-b border-background/10">
          <p className="font-semibold text-sm text-secondary">Admin Panel</p>
          <p className="text-xs text-background/60">{profile?.full_name}</p>
        </div>
        <nav className="p-2 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-background/70 hover:text-background hover:bg-background/10 rounded-md transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <div className="border-t border-background/10 my-2" />
          <Link
            href="/portal/orders"
            className="flex items-center gap-3 px-3 py-2 text-sm text-background/50 hover:text-background hover:bg-background/10 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Customer Portal
          </Link>
        </nav>
        <div className="p-2">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-background/50 hover:text-background hover:bg-background/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
