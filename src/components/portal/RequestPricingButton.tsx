"use client";

import { useState } from "react";
import { MailQuestion, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Variation {
  id: string;
  name: string | null;
}

interface Props {
  productId: string;
  productName: string;
  variations: Variation[];
  /** Used to pre-fill the contact message with who's asking. */
  buyerName: string | null;
  buyerEmail: string | null;
  buyerCompany: string | null;
}

/**
 * Buyer-facing "Request pricing" button on /portal/catalog.
 *
 * Valley quotes wholesale pricing per-customer, so the public catalog
 * doesn't show prices. Instead, buyers submit an inquiry that lands in
 * the admin Messages tab, and Charlie/Jackie follow up with a custom
 * quote.
 *
 * Submissions reuse the existing /api/contact endpoint and
 * `contact_messages` table — the message is prefixed so admins can spot
 * pricing inquiries quickly.
 */
export function RequestPricingButton({
  productId,
  productName,
  variations,
  buyerName,
  buyerEmail,
  buyerCompany,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");

  const variationsText =
    variations.length > 0
      ? variations
          .map((v) => v.name || "Default")
          .filter(Boolean)
          .join(", ")
      : "—";

  async function submit() {
    if (!buyerEmail) {
      toast.error("Your account is missing an email. Please contact Valley directly.");
      return;
    }
    setSubmitting(true);
    const message = [
      "PRICING INQUIRY (submitted from /portal/catalog)",
      "",
      `Product: ${productName}`,
      `SKU: ${productId}`,
      `Available sizes: ${variationsText}`,
      "",
      "Buyer note:",
      note.trim() || "(no additional note)",
    ].join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buyerName ?? buyerCompany ?? "Wholesale buyer",
          company: buyerCompany ?? null,
          email: buyerEmail,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }
      toast.success("Inquiry sent. Valley will be in touch with a custom quote.");
      setOpen(false);
      setNote("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not send your inquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <MailQuestion className="h-4 w-4 mr-1" />
            Request pricing
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request pricing — {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Valley quotes wholesale pricing per-customer. Submit an inquiry and
            Charlie or Jackie will follow up with a custom quote.
          </p>
          <div className="bg-muted/50 rounded-md p-3 space-y-1 text-xs">
            <p>
              <strong>Product:</strong> {productName}
            </p>
            <p>
              <strong>Available sizes:</strong> {variationsText}
            </p>
            <p>
              <strong>From:</strong>{" "}
              {buyerCompany ? `${buyerCompany} — ` : ""}
              {buyerName ?? "you"} ({buyerEmail ?? "no email on file"})
            </p>
          </div>
          <div>
            <label
              htmlFor="inquiry-note"
              className="block text-sm font-medium mb-1"
            >
              Anything else to include? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="inquiry-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. approximate volume, target grind, timeline…"
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send inquiry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
