import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  async function toggleApproval(formData: FormData) {
    "use server";
    const customerId = formData.get("customer_id") as string;
    const currentApproved = formData.get("current_approved") === "true";
    const supabase = await createClient();

    await supabase
      .from("profiles")
      .update({ is_approved: !currentApproved })
      .eq("id", customerId);

    revalidatePath("/admin/customers");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">Customers</h1>

      {!customers || customers.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          No customer accounts yet.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.company_name || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(customer.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.is_approved ? "default" : "secondary"}>
                      {customer.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={toggleApproval}>
                      <input type="hidden" name="customer_id" value={customer.id} />
                      <input
                        type="hidden"
                        name="current_approved"
                        value={String(customer.is_approved)}
                      />
                      <Button
                        type="submit"
                        variant={customer.is_approved ? "outline" : "default"}
                        size="sm"
                      >
                        {customer.is_approved ? "Revoke" : "Approve"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
