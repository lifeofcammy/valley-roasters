"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-border shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - bigger and prominent */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Valley Specialty Roasters"
              width={56}
              height={56}
              className="rounded-full"
              priority
            />
            <div className="hidden sm:block">
              <p className="font-display font-bold text-lg leading-tight text-foreground">
                Valley Specialty
              </p>
              <p className="font-display font-bold text-lg leading-tight text-foreground">
                Roasters
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6">
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
          <div className="md:hidden pb-4 space-y-1 border-t border-border pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-3 text-base font-semibold text-foreground/70 hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
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
