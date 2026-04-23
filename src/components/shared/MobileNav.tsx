"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
  Mail,
  Users,
  Coffee,
  ArrowLeft,
  RotateCcw,
  Settings,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Icon names that can be passed from Server Components → MobileNav.
 * We can't pass `LucideIcon` component references across the server/
 * client boundary (React 19 + Next 16 serialization), so layouts pass
 * strings and we resolve them here.
 */
export type NavIconName =
  | "dashboard"
  | "orders"
  | "messages"
  | "customers"
  | "products"
  | "catalog"
  | "back"
  | "reorder"
  | "settings"
  | "subscriptions";

const NAV_ICONS: Record<NavIconName, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  orders: Package,
  messages: Mail,
  customers: Users,
  products: Coffee,
  catalog: Coffee,
  back: ArrowLeft,
  reorder: RotateCcw,
  settings: Settings,
  subscriptions: Repeat,
};

export interface MobileNavLink {
  href: string;
  label: string;
  icon: NavIconName;
  variant?: "default" | "accent" | "muted";
}

interface MobileNavProps {
  primaryLabel: string;
  primaryName?: string;
  secondaryName?: string;
  links: MobileNavLink[];
  extraLink?: {
    href: string;
    label: string;
    icon: NavIconName;
  };
}

/**
 * Responsive nav for admin & portal layouts.
 * - On mobile (<sm): sticky top header with hamburger; drawer slides in from the left.
 * - On sm+: full-height left sidebar.
 */
export function MobileNav({
  primaryLabel,
  primaryName,
  secondaryName,
  links,
  extraLink,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const navBody = (
    <>
      <div className="p-4 border-b border-background/10">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="Valley Specialty Roasters"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-display font-bold text-sm text-background leading-tight">
            Valley Specialty
            <br />
            Roasters
          </span>
        </Link>
      </div>
      <div className="p-4 border-b border-background/10">
        <p className="font-semibold text-sm text-secondary truncate">
          {primaryLabel}
        </p>
        {primaryName && (
          <p className="text-sm text-background truncate">{primaryName}</p>
        )}
        {secondaryName && (
          <p className="text-xs text-background/60 truncate">{secondaryName}</p>
        )}
      </div>
      <nav className="p-2 space-y-1 flex-1">
        {links.map((link) => {
          const Icon = NAV_ICONS[link.icon] ?? Package;
          const isAccent = link.variant === "accent";
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={
                isAccent
                  ? "flex items-center gap-3 px-3 py-3 min-h-11 text-sm text-secondary hover:text-secondary/80 hover:bg-background/10 rounded-md transition-colors"
                  : "flex items-center gap-3 px-3 py-3 min-h-11 text-sm text-background/70 hover:text-background hover:bg-background/10 rounded-md transition-colors"
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
        {extraLink && (
          <>
            <div className="border-t border-background/10 my-2" />
            <Link
              href={extraLink.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 min-h-11 text-sm text-background/50 hover:text-background hover:bg-background/10 rounded-md transition-colors"
            >
              {(() => {
                const ExtraIcon = NAV_ICONS[extraLink.icon] ?? ArrowLeft;
                return <ExtraIcon className="h-4 w-4 flex-shrink-0" />;
              })()}
              <span className="truncate">{extraLink.label}</span>
            </Link>
          </>
        )}
      </nav>
      <div className="p-2">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-3 min-h-11 text-sm text-background/50 hover:text-background hover:bg-background/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar (sticky) */}
      <header className="sm:hidden sticky top-0 z-40 flex items-center justify-between gap-2 bg-foreground text-background px-4 py-3 border-b border-background/10">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt="Valley Specialty Roasters"
            width={32}
            height={32}
            className="rounded-full flex-shrink-0"
          />
          <span className="font-display font-bold text-sm text-background truncate">
            {primaryLabel}
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="text-background hover:text-background hover:bg-background/10 h-11 w-11"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="sm:hidden w-4/5 max-w-xs border-r-0 bg-foreground p-0 text-background"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{primaryLabel} navigation</SheetTitle>
            <SheetDescription>
              Use this menu to move between portal sections.
            </SheetDescription>
          </SheetHeader>
          {navBody}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex sm:flex-col sm:w-64 bg-foreground text-background flex-shrink-0 sticky top-0 h-screen max-h-screen overflow-y-auto">
        {navBody}
      </aside>
    </>
  );
}
