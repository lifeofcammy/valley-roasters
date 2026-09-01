"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Truck } from "lucide-react";
import {
  updateCatalogAssignmentAction,
  type AddCustomerState,
} from "@/app/admin/customers/actions";

const initialState: AddCustomerState = { success: false, error: null };

interface CategoryOption {
  id: string;
  name: string;
  itemCount: number;
}

interface Props {
  customerId: string;
  currentCategoryId: string | null;
  alwaysChargeDelivery: boolean;
  options: CategoryOption[];
}

/**
 * The catalog control — which Square category is this customer's coffee
 * price list, plus the flat-delivery flag for distant locations.
 *
 * Options arrive from the server page, pulled live from Square, so a
 * category created in Square moments ago is already in the list. With no
 * selection the customer's portal catalog is empty by design: pricing
 * only ever comes from a category Charlie deliberately assigned.
 */
export function CatalogAssignment({
  customerId,
  currentCategoryId,
  alwaysChargeDelivery,
  options,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateCatalogAssignmentAction,
    initialState
  );

  useEffect(() => {
    if (state.success) toast.success("Catalog assignment saved.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  const currentIsMissing =
    currentCategoryId && !options.some((o) => o.id === currentCategoryId);

  return (
    <form action={formAction} className="mb-6">
      <input type="hidden" name="customer_id" value={customerId} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Catalog &amp; Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price_category_id">Coffee pricing category</Label>
            <select
              id="price_category_id"
              name="price_category_id"
              defaultValue={currentCategoryId ?? ""}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— None (catalog hidden from customer) —</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.itemCount} item{o.itemCount === 1 ? "" : "s"})
                </option>
              ))}
              {currentIsMissing && (
                <option value={currentCategoryId!}>
                  (current selection — no longer found in Square)
                </option>
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              This list comes straight from Square — create a category there,
              add their items and prices, then pick it here. The customer sees
              that category plus the shared food, pastry &amp; Lezzet items.
              With none selected, their catalog page shows nothing.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="always_charge_delivery"
              defaultChecked={alwaysChargeDelivery}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Always charge the $5 delivery fee
              </span>
              <span className="block text-xs text-muted-foreground">
                For far-away locations — the fee applies to every order,
                ignoring the $300 free-delivery threshold.
              </span>
            </span>
          </label>

          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Catalog Assignment"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
