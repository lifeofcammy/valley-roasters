"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSquareCustomer,
  isSquareConfigured,
} from "@/lib/square/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

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

  // 2. Create Supabase auth user with a generated temporary password
  const tempPassword = `Valley-${randomUUID().slice(0, 12)}!`;
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation for admin-created accounts
    });

  if (authError || !authUser?.user) {
    console.error("Failed to create auth user:", authError);
    return {
      success: false,
      error:
        authError?.message ?? "Failed to create user account. The email may already be in use.",
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
