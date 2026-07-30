"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import {
  resendInviteAction,
  type AddCustomerState,
} from "@/app/admin/customers/actions";

const initialState: AddCustomerState = { success: false, error: null };

/**
 * Emails this customer a fresh link to set their password.
 *
 * Needed for the accounts created before invites existed — those were
 * given a random temporary password that was never shown to anyone, so
 * the buyer has no way in until they get one of these.
 */
export function ResendInviteButton({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    resendInviteAction,
    initialState
  );

  useEffect(() => {
    if (state.success) toast.success(`Login link sent to ${email}`);
    else if (state.error) toast.error(state.error);
  }, [state, email]);

  if (!email) return null;

  return (
    <form action={formAction} className="flex-shrink-0">
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        title="Email this customer a link to set their password"
      >
        {pending ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-1 h-4 w-4" />
        )}
        Send login link
      </Button>
    </form>
  );
}
