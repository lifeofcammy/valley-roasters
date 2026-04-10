"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { addCustomerAction, type AddCustomerState } from "./actions";

const initialState: AddCustomerState = { success: false, error: null };

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addCustomerAction,
    initialState
  );

  // Close dialog on success and reset
  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Creates a Square customer, a portal login, and marks the account as
            approved.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              name="company_name"
              required
              placeholder="Acme Coffee Co."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name *</Label>
            <Input
              id="contact_name"
              name="contact_name"
              required
              placeholder="Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@acmecoffee.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(480) 555-1234"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
