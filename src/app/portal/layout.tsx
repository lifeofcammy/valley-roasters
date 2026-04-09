import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, type MobileNavLink } from "@/components/shared/MobileNav";

const portalLinks: MobileNavLink[] = [
  { href: "/portal/orders", label: "Orders", icon: "orders" },
  { href: "/portal/reorder", label: "New Order", icon: "reorder" },
  { href: "/portal/subscriptions", label: "Recurring", icon: "subscriptions" },
  { href: "/portal/account", label: "Account", icon: "settings" },
];

export default async function PortalLayout({
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
    .select("full_name, company_name, role")
    .eq("id", user.id)
    .single();

  // For admins viewing the customer portal, prepend a prominent
  // "Back to Admin" link at the very top of the sidebar so they
  // never get stranded in the customer view.
  const links: MobileNavLink[] = [];
  if (profile?.role === "admin") {
    links.push({
      href: "/admin",
      label: "← Back to Admin",
      icon: "back",
      variant: "accent",
    });
  }
  links.push(...portalLinks);

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <MobileNav
        primaryLabel={profile?.company_name ?? "Customer Portal"}
        primaryName={profile?.full_name ?? undefined}
        links={links}
      />

      <main className="flex-1 bg-background min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
