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

  // Establish the session from whatever Supabase put in the invite link.
  //
  // Supabase sends these three ways depending on flow and email template,
  // so handle all of them rather than betting on one:
  //   1. ?token_hash=..&type=invite   -> verifyOtp (custom template)
  //   2. #access_token=..&refresh_token=..  -> the browser client picks
  //      this up itself via detectSessionInUrl; we just wait for it. This
  //      is what admin-generated invites use, and it's why pointing the
  //      link at a server route never worked: a hash fragment is never
  //      sent to the server.
  //   3. ?code=..                     -> PKCE, only when the same browser
  //      started the flow.
  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", userId)
        .maybeSingle();
      if (active) setCompanyName(profile?.company_name ?? null);
    }

    async function settle(userId: string) {
      if (!active) return;
      setHasSession(true);
      await loadProfile(userId);
      if (active) setChecking(false);
    }

    // Supabase reports a dead link in the hash — show the expired state
    // rather than spinning.
    const hash = new URLSearchParams(
      typeof window !== "undefined" ? window.location.hash.slice(1) : ""
    );
    if (hash.get("error")) {
      setChecking(false);
      return;
    }

    // Fires once the browser client finishes reading tokens out of the URL.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void settle(session.user.id);
    });

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "recovery" | "email" | "magiclink",
        });
        if (!error && data.user) return settle(data.user.id);
      } else if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          code
        );
        if (!error && data.user) return settle(data.user.id);
      }

      // Either the hash flow is still landing (onAuthStateChange will fire)
      // or there's already a session from a previous visit.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (user) return settle(user.id);

      // Give detectSessionInUrl a moment before declaring the link dead.
      setTimeout(() => {
        if (active) setChecking(false);
      }, 1500);
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
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
