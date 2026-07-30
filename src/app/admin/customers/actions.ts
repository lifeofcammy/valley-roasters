"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSquareCustomer,
  isSquareConfigured,
} from "@/lib/square/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { SITE_URL } from "@/lib/constants";

export type AddCustomerState = {
  success: boolean;
  error: string | null;
};

export async function addCustomerAction(
  _prev: AddCustomerState,
  formData: FormData
): Promise<AddCustomerState> {
  // Verify caller is admin
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (!actor) return { success: false, error: "Not authenticated" };

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle();
  if (actorProfile?.role !== "admin")
    return { success: false, error: "Forbidden" };

  const companyName = (formData.get("company_name") as string)?.trim();
  const contactName = (formData.get("contact_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!companyName || !contactName || !email) {
    return {
      success: false,
      error: "Company name, contact name, and email are required.",
    };
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  const admin = createAdminClient();

  // 1. Create Square customer (if configured)
  let squareCustomerId: string | null = null;
  if (isSquareConfigured()) {
    try {
      const result = await createSquareCustomer({
        companyName,
        givenName: contactName,
        emailAddress: email,
        phoneNumber: phone ?? undefined,
        idempotencyKey: randomUUID(),
      });
      squareCustomerId = result.square_customer_id;
    } catch (err) {
      console.error("Failed to create Square customer:", err);
      return {
        success: false,
        error:
          "Failed to create Square customer. Please try again or create manually in Square.",
      };
    }
  }

  // 2. Create the auth user by INVITING them — Supabase emails a signup
  //    link and the buyer sets their own password on /welcome. (This used
  //    to createUser() with a random temp password that was thrown away,
  //    so the customer had no way to ever sign in.)
  const { data: authUser, error: authError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/welcome`,
      data: { company_name: companyName, full_name: contactName },
    });

  if (authError || !authUser?.user) {
    console.error("Failed to invite user:", authError);
    return {
      success: false,
      error:
        authError?.message ??
        "Could not send the invite. The email may already have an account.",
    };
  }

  // 3. Create profile row linked to the Square customer, marked as approved
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: authUser.user.id,
      email,
      full_name: contactName,
      company_name: companyName,
      company_phone: phone,
      square_customer_id: squareCustomerId,
      role: "customer",
      is_approved: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Failed to create profile:", profileError);
    return {
      success: false,
      error: "User account created but profile setup failed. Please edit the customer manually.",
    };
  }

  revalidatePath("/admin/customers");
  return { success: true, error: null };
}

/**
 * Email an existing customer a fresh link to set their password.
 *
 * Covers three cases:
 *  - the original invite expired or was deleted
 *  - an account created before invites existed (those got a random
 *    temporary password that was never shown to anyone)
 *  - the buyer simply forgot their password and asks Valley directly
 *
 * Uses a recovery link rather than a second invite, because Supabase
 * rejects inviting an email that already has an account.
 */
export async function resendInviteAction(
  _prev: AddCustomerState,
  formData: FormData
): Promise<AddCustomerState> {
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (!actor) return { success: false, error: "Not authenticated" };

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle();
  if (actorProfile?.role !== "admin")
    return { success: false, error: "Forbidden" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { success: false, error: "Email is required." };

  // resetPasswordForEmail sends the mail; the link lands on /auth/callback
  // which exchanges the code and drops them on /welcome to pick a password.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/welcome`,
  });

  if (error) {
    console.error("Failed to resend invite:", error);
    return {
      success: false,
      error: error.message ?? "Could not send the email. Please try again.",
    };
  }

  return { success: true, error: null };
}
