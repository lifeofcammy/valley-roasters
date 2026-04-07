"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Profile {
  full_name: string;
  company_name: string;
  company_phone: string;
  company_address_line1: string;
  company_address_line2: string;
  company_city: string;
  company_state: string;
  company_zip: string;
  email: string;
}

export default function AccountPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name, company_phone, company_address_line1, company_address_line2, company_city, company_state, company_zip, email")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        company_phone: profile.company_phone,
        company_address_line1: profile.company_address_line1,
        company_address_line2: profile.company_address_line2,
        company_city: profile.company_city,
        company_state: profile.company_state,
        company_zip: profile.company_zip,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated successfully.");
    }
    setSaving(false);
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">Account Settings</h1>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={profile.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profile.company_phone}
                  onChange={(e) => updateField("company_phone", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input
                value={profile.company_address_line1}
                onChange={(e) => updateField("company_address_line1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={profile.company_address_line2}
                onChange={(e) => updateField("company_address_line2", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={profile.company_city}
                  onChange={(e) => updateField("company_city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={profile.company_state}
                  onChange={(e) => updateField("company_state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input
                  value={profile.company_zip}
                  onChange={(e) => updateField("company_zip", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
