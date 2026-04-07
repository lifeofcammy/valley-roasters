"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Logo size="small" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login">
              <Button variant="default" size="sm">
                Wholesale Login
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="default" size="sm" className="w-full">
                  Wholesale Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
