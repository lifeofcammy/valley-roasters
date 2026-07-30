"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Landing page for an invited wholesale buyer.
 *
 * Flow: admin invites → Supabase emails a link → the link hits
 * /auth/callback which exchanges the code for a session → lands here with
 * the buyer already signed in but with no password of their own. They set
 * one and go straight into the portal.
 *
 * Also used by the "resend invite" recovery email, so the copy works for
 * both a first-time setup and a reset.
 */
export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // The invite link creates the session before redirecting here. If it's
  // missing, the link was already used or expired.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setHasSession(Boolean(user));
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name")
          .eq("id", user.id)
          .maybeSingle();
        if (active) setCompanyName(profile?.company_name ?? null);
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || "Could not set your password.");
      setSaving(false);
      return;
    }
    toast.success("You're all set — welcome to Valley.");
    router.push("/portal/orders");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-3">
            <h1 className="font-display text-2xl font-bold">
              This link has expired
            </h1>
            <p className="text-sm text-muted-foreground">
              Invite links can only be used once. Ask Valley to send you a new
              one, or reset your password from the login page.
            </p>
            <Button
              className="w-full mt-2"
              onClick={() => router.push("/login")}
            >
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Image
              src="/logo.png"
              alt="Valley Specialty Roasters"
              width={72}
              height={72}
              className="rounded-full mx-auto mb-4"
            />
            <h1 className="font-display text-2xl font-bold">
              Welcome{companyName ? `, ${companyName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a password and your wholesale account is ready.
            </p>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium mb-1"
              >
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it again"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                "Set password & continue"
              )}
            </Button>
          </form>

          <ul className="mt-6 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              See your full order history, pulled live from Square
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              Reorder past orders at your agreed pricing
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              Browse the catalog and pick your grind
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
