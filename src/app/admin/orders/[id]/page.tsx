import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ADMIN_SELECTABLE_STATUSES,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { displayStatusName, toCanonicalStatus } from "@/lib/order-status";
import {
  publishSquareInvoice,
  cancelSquareInvoice,
  isSquareConfigured,
} from "@/lib/square/client";
import { format } from "date-fns";

async function assertAdmin() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") throw new Error("Forbidden");
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), profiles(company_name, full_name, email, company_phone)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  async function updateStatus(formData: FormData) {
    "use server";
    await assertAdmin();

    const raw = String(formData.get("status") ?? "");
    if (!(ADMIN_SELECTABLE_STATUSES as readonly string[]).includes(raw)) {
      throw new Error("Invalid status");
    }
    const newStatus = raw as (typeof ADMIN_SELECTABLE_STATUSES)[number];
    const adminNotes = (formData.get("admin_notes") as string) ?? "";
    const rejectionReason = (
      (formData.get("rejection_reason") as string) ?? ""
    ).trim();

    if (newStatus === "rejected" && rejectionReason.length === 0) {
      throw new Error(
        "Rejection reason is required — this goes to the customer."
      );
    }

    // Re-read the current order (admin client — we need square_invoice_id
    // and the prior status for transition detection, even though the outer
    // page read already loaded it).
    const admin = createAdminClient();
    const { data: current, error: readErr } = await admin
      .from("orders")
      .select(
        "id, status, admin_notes, square_invoice_id, square_invoice_status"
      )
      .eq("id", id)
      .single();
    if (readErr || !current) {
      throw new Error("Order not found");
    }

    const previousCanonical = toCanonicalStatus(current.status);
    const isTransition = previousCanonical !== newStatus;

    // Compose final admin_notes — prepend rejection reason when rejecting
    // so it's visible above older notes on subsequent views.
    const finalNotes =
      newStatus === "rejected" && rejectionReason
        ? `REJECTED (${new Date().toISOString().slice(0, 10)}): ${rejectionReason}${
            adminNotes ? `\n\n${adminNotes}` : ""
          }`
        : adminNotes;

    // Mirror the transition into Square if we can. Failures here are
    // logged but do NOT block the DB update — the admin can retry the
    // Square side manually from the Square dashboard if needed.
    let squareInvoiceStatus: string | null = current.square_invoice_status;
    let squareSyncError: string | null = null;

    if (
      isTransition &&
      current.square_invoice_id &&
      isSquareConfigured()
    ) {
      try {
        if (newStatus === "in_process") {
          // Publish DRAFT → Square emails the invoice to the customer.
          // Skip if the invoice has already been published (UNPAID/PAID)
          // to avoid a duplicate send.
          const alreadyPublished =
            current.square_invoice_status === "UNPAID" ||
            current.square_invoice_status === "PAID" ||
            current.square_invoice_status === "SCHEDULED";
          if (!alreadyPublished) {
            const pub = await publishSquareInvoice(
              current.square_invoice_id,
              `publish-${id}`
            );
            squareInvoiceStatus = (pub.status ?? "UNPAID").toUpperCase();
          }
        } else if (newStatus === "rejected") {
          // Cancel invoice with reason in memo → Square emails cancellation.
          // Don't cancel if already canceled or paid.
          const skip =
            current.square_invoice_status === "CANCELED" ||
            current.square_invoice_status === "PAID" ||
            current.square_invoice_status === "REFUNDED";
          if (!skip) {
            const cancelled = await cancelSquareInvoice(
              current.square_invoice_id,
              rejectionReason
            );
            squareInvoiceStatus = (cancelled.status ?? "CANCELED").toUpperCase();
          }
        }
        // newStatus === "shipped" or "received" → DB-only update; no
        // Square-side action. See HANDOFF.md for why "Shipped" has no
        // automated email (Square has no shipping notification).
      } catch (err) {
        console.error("[admin status update] Square sync failed:", err);
        squareSyncError =
          err instanceof Error ? err.message : "Square sync failed";
      }
    }

    const { error: updErr } = await admin
      .from("orders")
      .update({
        status: newStatus,
        admin_notes: finalNotes,
        ...(squareInvoiceStatus
          ? { square_invoice_status: squareInvoiceStatus }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updErr) {
      throw new Error(
        squareSyncError
          ? `DB update failed after Square sync: ${updErr.message} (Square: ${squareSyncError})`
          : `DB update failed: ${updErr.message}`
      );
    }

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath(`/admin/orders`);
  }

  const profile = order.profiles as {
    company_name: string;
    full_name: string;
    email: string;
    company_phone: string;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <Link href="/admin/orders" className="flex-shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {order.order_items?.map(
                  (item: {
                    id: string;
                    product_name: string;
                    size: string;
                    quantity: number;
                    unit_price_cents: number;
                    total_cents: number;
                  }) => (
                    <div
                      key={item.id}
                      className="border rounded-md p-3 bg-muted/30"
                    >
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity} &times; $
                          {(item.unit_price_cents / 100).toFixed(2)}
                        </span>
                        <span className="font-semibold">
                          ${(item.total_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items?.map(
                      (item: {
                        id: string;
                        product_name: string;
                        size: string;
                        quantity: number;
                        unit_price_cents: number;
                        total_cents: number;
                      }) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${(item.unit_price_cents / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.total_cents / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t mt-4 pt-4 text-right">
                <p className="text-lg font-bold">
                  Total: ${(order.total_cents / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fix A — unmissable warning when order is unpaid */}
          {order.payment_status !== "paid" && order.status !== "cancelled" && (
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-700 dark:text-amber-400 text-2xl leading-none">
                  ⚠️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Payment pending — do not fulfill this order yet
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                    This order has not been paid. Wait for the Square invoice
                    to be marked PAID before starting work on it. Fulfilling
                    now means you might not get paid.
                  </p>
                  {order.square_invoice_public_url && (
                    <a
                      href={order.square_invoice_public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-amber-900 dark:text-amber-200 underline hover:no-underline"
                    >
                      Check Square invoice status ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Update Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Select
                    name="status"
                    defaultValue={toCanonicalStatus(order.status)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_SELECTABLE_STATUSES.map((status) => {
                        // Soft-lock "Shipped" until the invoice is paid —
                        // shipping before getting paid is the costly failure
                        // mode. "In process" is NOT locked: publishing the
                        // invoice is what produces the payment link.
                        const locked =
                          status === "shipped" &&
                          order.payment_status !== "paid";
                        return (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={locked}
                          >
                            {displayStatusName(status)}
                            {locked ? " — payment pending" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Picking <strong>In process</strong> publishes the Square
                    invoice and emails it to the customer.{" "}
                    <strong>Rejected</strong> cancels the invoice with the
                    reason you provide.{" "}
                    <strong>Shipped</strong> updates the dashboard only — no
                    email is sent (Square has no shipping notification; send
                    a note manually from Square if needed).
                  </p>
                </div>

                {/* Rejection reason — only relevant when picking Rejected,
                    but we render it always so the server action can read it
                    off the form without JS. The server enforces the required
                    rule when status='rejected'. */}
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">
                    Rejection reason{" "}
                    <span className="text-muted-foreground font-normal">
                      (required if picking Rejected — goes to the customer)
                    </span>
                  </Label>
                  <Textarea
                    id="rejection_reason"
                    name="rejection_reason"
                    placeholder="e.g. Out of stock on Brazil Natural — expected back 2 weeks. Please reorder then or pick an alternate."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    name="admin_notes"
                    defaultValue={order.admin_notes || ""}
                    placeholder="Internal notes about this order..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  Update Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold truncate">{profile?.company_name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground break-all">
                <a href={`mailto:${profile?.email}`} className="hover:underline">
                  {profile?.email}
                </a>
              </p>
              {profile?.company_phone && (
                <p className="text-sm text-muted-foreground">
                  <a
                    href={`tel:${profile.company_phone}`}
                    className="hover:underline"
                  >
                    {profile.company_phone}
                  </a>
                </p>
              )}
              <Link
                href={`/admin/customers/${order.profile_id}`}
                className="text-sm text-primary hover:underline block mt-2"
              >
                View Customer Details
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">Order:</span>
                <Badge
                  variant="secondary"
                  className={ORDER_STATUS_COLORS[order.status as OrderStatus]}
                >
                  {displayStatusName(order.status)}
                </Badge>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <Badge
                  variant={
                    order.payment_status === "paid" ? "default" : "secondary"
                  }
                >
                  {order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {(order.square_invoice_id || order.square_order_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Square Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This order was mirrored into Square as a draft invoice.
                  Review and send it from Square to bill the customer.
                </p>
                {order.square_invoice_public_url && (
                  <a
                    href={order.square_invoice_public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all block"
                  >
                    Open Invoice in Square ↗
                  </a>
                )}
                {order.square_invoice_id && (
                  <p className="text-xs text-muted-foreground break-all">
                    Invoice ID: {order.square_invoice_id}
                  </p>
                )}
                {order.square_order_id && (
                  <p className="text-xs text-muted-foreground break-all">
                    Order ID: {order.square_order_id}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
