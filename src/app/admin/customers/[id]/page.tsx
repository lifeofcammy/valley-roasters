import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { ArrowLeft, Eye } from "lucide-react";
import { ResendInviteButton } from "./resend-invite-button";
import { EditCustomerDetails } from "./edit-customer-details";
import { CatalogAssignment } from "./catalog-assignment";
import {
  fetchValleyCategories,
  isSquareConfigured,
  type SquareCategoryOption,
} from "@/lib/square/client";
import { SHARED_CATEGORY_IDS } from "@/lib/account-pricing";
import { format } from "date-fns";

async function assertAdmin() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") throw new Error("Forbidden");
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [customerRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("profile_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const customer = customerRes.data;
  if (!customer) notFound();

  // Options for the catalog dropdown — live from Square, minus the shared
  // food/Lezzet categories (those go to everyone automatically and must
  // not be assignable as someone's coffee price list).
  let categoryOptions: SquareCategoryOption[] = [];
  if (isSquareConfigured()) {
    try {
      const all = await fetchValleyCategories();
      categoryOptions = all.filter((c) => !SHARED_CATEGORY_IDS.includes(c.id));
    } catch (err) {
      console.error("[admin/customer] category fetch failed:", err);
    }
  }

  async function updateAdminFields(formData: FormData) {
    "use server";
    await assertAdmin();
    const supabase = await createClient();
    const isApproved = formData.get("is_approved") === "on";
    const internalNotes = (formData.get("internal_notes") as string) || null;
    await supabase
      .from("profiles")
      .update({ is_approved: isApproved, internal_notes: internalNotes })
      .eq("id", id);
    revalidatePath(`/admin/customers/${id}`);
    revalidatePath("/admin/customers");
  }

  return (
    <div>
      <div className="flex items-start gap-3 mb-6 sm:mb-8 flex-wrap">
        <Link href="/admin/customers" className="flex-shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
            {customer.company_name}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {customer.full_name} &middot;{" "}
            <a href={`mailto:${customer.email}`} className="hover:underline">
              {customer.email}
            </a>
          </p>
        </div>
        <ResendInviteButton email={customer.email ?? ""} />
        <form action="/api/admin/impersonate" method="POST" className="flex-shrink-0">
          <input type="hidden" name="targetCustomerId" value={customer.id} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            title="View the portal as this customer"
          >
            <Eye className="mr-1 h-4 w-4" />
            View as Customer
          </Button>
        </form>
        <Badge
          variant={customer.is_approved ? "default" : "secondary"}
          className="flex-shrink-0"
        >
          {customer.is_approved ? "Approved" : "Pending"}
        </Badge>
      </div>

      {/* Contact details — editable so staff can fix onboarding typos */}
      <EditCustomerDetails
        customerId={customer.id}
        email={customer.email ?? ""}
        contactName={customer.full_name ?? ""}
        companyName={customer.company_name ?? ""}
        phone={customer.company_phone ?? ""}
      />

      {/* Catalog assignment — Charlie's price-list control */}
      <CatalogAssignment
        customerId={customer.id}
        currentCategoryId={customer.square_price_category_id ?? null}
        alwaysChargeDelivery={Boolean(customer.always_charge_delivery)}
        options={categoryOptions}
      />

      {/* Status & Internal Notes — admin-only edit form */}
      <form action={updateAdminFields} className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Account & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_approved"
                defaultChecked={customer.is_approved}
                className="mt-1 h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">
                  Approved (active wholesale account)
                </p>
                <p className="text-xs text-muted-foreground">
                  Uncheck to suspend this customer&apos;s portal access. They
                  can still log in but can&apos;t place orders or see prices.
                </p>
              </div>
            </label>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">
                Internal notes (admin only)
              </Label>
              <Textarea
                id="internal_notes"
                name="internal_notes"
                rows={4}
                placeholder="Anything Top Cup staff needs to remember about this customer — payment terms, contact preferences, special instructions..."
                defaultValue={customer.internal_notes ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Visible only to admins. Customers never see this.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Save Account Changes
            </Button>
          </CardContent>
        </Card>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {!ordersRes.data || ordersRes.data.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet.
              </p>
            ) : (
              <div className="space-y-2">
                {ordersRes.data.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-medium">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          ORDER_STATUS_COLORS[order.status as OrderStatus]
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Company:</span>
              <span className="break-words">{customer.company_name}</span>

              <span className="text-muted-foreground">Contact:</span>
              <span className="break-words">{customer.full_name}</span>

              <span className="text-muted-foreground">Email:</span>
              <a
                href={`mailto:${customer.email}`}
                className="text-primary hover:underline break-all"
              >
                {customer.email}
              </a>

              <span className="text-muted-foreground">Phone:</span>
              <span>
                {customer.company_phone ? (
                  <a
                    href={`tel:${customer.company_phone}`}
                    className="text-primary hover:underline"
                  >
                    {customer.company_phone}
                  </a>
                ) : (
                  "—"
                )}
              </span>

              <span className="text-muted-foreground">Address:</span>
              <span className="break-words">
                {[
                  customer.company_address_line1,
                  customer.company_city,
                  customer.company_state,
                  customer.company_zip,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>

              <span className="text-muted-foreground">Joined:</span>
              <span>
                {format(new Date(customer.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
