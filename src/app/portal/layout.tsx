import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveProfile } from "@/lib/impersonate";
import { MobileNav, type MobileNavLink } from "@/components/shared/MobileNav";
import { ImpersonationProvider } from "@/components/shared/ImpersonationProvider";

const portalLinks: MobileNavLink[] = [
  { href: "/portal/orders", label: "Orders", icon: "orders" },
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

  // Resolve the effective profile. While impersonating, this is the
  // target customer; otherwise it's the actual signed-in user.
  const effective = await getEffectiveProfile();

  // For admins viewing the customer portal we still want to read
  // the ACTUAL user's role for sidebar decisions (the "Back to Admin"
  // link should always show for admins, even when impersonating).
  const { data: actualProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const displayProfile = effective.profile;
  const isImpersonating = effective.isImpersonating;
  const impersonatedName =
    isImpersonating && displayProfile
      ? displayProfile.company_name ?? displayProfile.full_name ?? "customer"
      : null;

  // Sidebar: prepend a "Back to Admin" link at the very top so admins
  // (impersonating or not) never get stranded in the customer view.
  const links: MobileNavLink[] = [];
  if (actualProfile?.role === "admin") {
    links.push({
      href: "/admin",
      label: "← Back to Admin",
      icon: "back",
      variant: "accent",
    });
  }
  links.push(...portalLinks);

  return (
    <ImpersonationProvider
      isImpersonating={isImpersonating}
      impersonatedName={impersonatedName}
    >
      <div className="min-h-screen flex flex-col sm:flex-row">
        <MobileNav
          primaryLabel={displayProfile?.company_name ?? "Customer Portal"}
          primaryName={displayProfile?.full_name ?? undefined}
          links={links}
        />

        <main className="flex-1 bg-background min-w-0">
          {isImpersonating && impersonatedName && (
            <div className="sticky top-0 z-40 border-b-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-200 min-w-0">
                <Eye className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  Viewing as <strong>{impersonatedName}</strong> (admin preview)
                </span>
              </p>
              <form
                action="/api/admin/stop-impersonating"
                method="POST"
                className="flex-shrink-0"
              >
                <button
                  type="submit"
                  className="text-sm font-semibold underline hover:no-underline text-amber-900 dark:text-amber-200"
                >
                  Stop & return to admin
                </button>
              </form>
            </div>
          )}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </ImpersonationProvider>
  );
}
