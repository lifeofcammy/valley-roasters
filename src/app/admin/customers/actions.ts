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
      redirectTo: `${SITE_URL}/welcome`,
      data: { company_name: companyName, full_name: contactName },
    });

  if (authError || !authUser?.user) {
    console.error("Failed to invite user:", authError);
    // Translate Supabase's terse auth errors into something an admin can
    // act on — these two come up constantly when onboarding a batch of
    // locations that share an inbox.
    const raw = authError?.message ?? "";
    let friendly =
      "Could not send the invite. Please try again in a few minutes.";
    if (/rate limit/i.test(raw)) {
      friendly =
        "Email limit reached — Supabase only allows a few invites per hour on the current plan. Wait about an hour and try again, or ask Cam to switch on Valley's own email sending to remove the limit.";
    } else if (/already|exists|registered/i.test(raw)) {
      friendly =
        `${email} already has an account. Each location needs its own email address — for a shared inbox you can use a tag like name+phoenix@gmail.com, which still delivers to the same inbox. If the account already exists, open it and use "Send login link" instead.`;
    } else if (raw) {
      friendly = raw;
    }
    return { success: false, error: friendly };
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
 * Edit a customer's contact details — email, contact name, company
 * name, phone.
 *
 * Exists so Valley staff can fix onboarding typos themselves (a
 * misspelled email once left an invited buyer with an unreachable
 * account that only a developer could repair). Email is the delicate
 * field: it lives in Supabase Auth, not just our profiles table, so a
 * change must go through the auth admin API first — if that fails
 * (e.g. the address already belongs to another account) nothing else
 * is touched. `email_confirm: true` keeps the account usable
 * immediately; the buyer's password is unchanged.
 */
export async function updateCustomerDetailsAction(
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

  const customerId = (formData.get("customer_id") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const contactName = (formData.get("contact_name") as string)?.trim();
  const companyName = (formData.get("company_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!customerId) return { success: false, error: "Missing customer id." };
  if (!companyName || !contactName || !email) {
    return {
      success: false,
      error: "Company name, contact name, and email are required.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  const admin = createAdminClient();

  // Never let an admin edit another admin's account through this form.
  const { data: target } = await admin
    .from("profiles")
    .select("email, role")
    .eq("id", customerId)
    .maybeSingle();
  if (!target) return { success: false, error: "Customer not found." };
  if (target.role !== "customer") {
    return { success: false, error: "Only customer accounts can be edited here." };
  }

  // 1. Email changes go through Supabase Auth first. If this fails,
  //    stop before touching the profile so the two never disagree.
  if (email !== (target.email ?? "").toLowerCase()) {
    const { error: authError } = await admin.auth.admin.updateUserById(
      customerId,
      { email, email_confirm: true }
    );
    if (authError) {
      return {
        success: false,
        error:
          authError.message ??
          "Could not change the email. It may already be in use by another account.",
      };
    }
  }

  // 2. Profile fields.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      email,
      full_name: contactName,
      company_name: companyName,
      company_phone: phone,
    })
    .eq("id", customerId);

  if (profileError) {
    console.error("Failed to update customer profile:", profileError);
    return {
      success: false,
      error: "Login email was updated but profile details failed — try again.",
    };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
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

  // Land straight on /welcome. It's a client page, so it can read the
  // access token Supabase returns in the URL hash — a server route can't,
  // which is why routing these through /auth/callback produced an error
  // page for every recipient.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/welcome`,
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

/**
 * Assign which Square category is this customer's coffee price list,
 * and whether the flat delivery fee applies to every order.
 *
 * This IS the catalog control: Charlie builds a category in Square,
 * then picks it here. Clearing the selection (empty value) hides the
 * customer's entire catalog until a new one is chosen — deliberate,
 * per the client's "no default pricing" rule.
 */
export async function updateCatalogAssignmentAction(
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

  const customerId = (formData.get("customer_id") as string)?.trim();
  const categoryId =
    ((formData.get("price_category_id") as string) || "").trim() || null;
  const alwaysDelivery = formData.get("always_charge_delivery") === "on";

  if (!customerId) return { success: false, error: "Missing customer id." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", customerId)
    .maybeSingle();
  if (!target) return { success: false, error: "Customer not found." };
  if (target.role !== "customer") {
    return { success: false, error: "Only customer accounts can be edited here." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      square_price_category_id: categoryId,
      always_charge_delivery: alwaysDelivery,
    })
    .eq("id", customerId);

  if (error) {
    console.error("Failed to update catalog assignment:", error);
    return { success: false, error: "Could not save. Please try again." };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true, error: null };
}
