"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil } from "lucide-react";
import {
  updateCustomerDetailsAction,
  type AddCustomerState,
} from "@/app/admin/customers/actions";

const initialState: AddCustomerState = { success: false, error: null };

interface Props {
  customerId: string;
  email: string;
  contactName: string;
  companyName: string;
  phone: string;
}

/**
 * Admin form for editing a customer's contact details.
 *
 * Lets Valley staff fix onboarding typos (especially email — which also
 * updates the customer's login) without needing a developer. A changed
 * email takes effect immediately and the customer's password is
 * untouched; if they haven't set one yet, "Send login link" still works
 * and now goes to the corrected address.
 */
export function EditCustomerDetails({
  customerId,
  email,
  contactName,
  companyName,
  phone,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateCustomerDetailsAction,
    initialState
  );

  useEffect(() => {
    if (state.success) toast.success("Customer details updated.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="mb-6">
      <input type="hidden" name="customer_id" value={customerId} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_company_name">Company Name *</Label>
              <Input
                id="edit_company_name"
                name="company_name"
                defaultValue={companyName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_contact_name">Contact Name *</Label>
              <Input
                id="edit_contact_name"
                name="contact_name"
                defaultValue={contactName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                name="email"
                type="email"
                defaultValue={email}
                required
              />
              <p className="text-xs text-muted-foreground">
                Changing this also changes their login email, effective
                immediately. Their password stays the same.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                name="phone"
                type="tel"
                defaultValue={phone}
                placeholder="(480) 555-0123"
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Details"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
