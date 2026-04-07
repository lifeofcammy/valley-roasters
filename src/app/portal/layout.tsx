import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/Logo";
import { Package, RotateCcw, Settings, LogOut } from "lucide-react";

const portalLinks = [
  { href: "/portal/orders", label: "Orders", icon: Package },
  { href: "/portal/reorder", label: "New Order", icon: RotateCcw },
  { href: "/portal/account", label: "Account", icon: Settings },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-64 bg-foreground text-background flex-shrink-0">
        <div className="p-6 border-b border-background/10">
          <Logo size="small" className="[&_*]:text-background [&_span]:text-background/60" />
        </div>
        <div className="p-4 border-b border-background/10">
          <p className="font-semibold text-sm">{profile?.company_name}</p>
          <p className="text-xs text-background/60">{profile?.full_name}</p>
        </div>
        <nav className="p-2 space-y-1">
          {portalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-background/70 hover:text-background hover:bg-background/10 rounded-md transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-sm text-secondary hover:text-secondary/80 hover:bg-background/10 rounded-md transition-colors"
            >
              <Settings className="h-4 w-4" />
              Admin Dashboard
            </Link>
          )}
        </nav>
        <div className="p-2 mt-auto">
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

      {/* Main content */}
      <main className="flex-1 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
