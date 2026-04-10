import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Customers
      </h1>

      {!customers || customers.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          No customer accounts yet.
        </p>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="border rounded-lg p-4 bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="min-w-0 flex-1 block"
                  >
                    <p className="font-semibold text-base text-primary truncate">
                      {customer.company_name || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {customer.email}
                    </p>
                  </Link>
                  <Badge
                    variant={customer.is_approved ? "default" : "secondary"}
                    className="flex-shrink-0"
                  >
                    {customer.is_approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Joined{" "}
                    {format(new Date(customer.created_at), "MMM d, yyyy")}
                  </p>
                  <Link href={`/admin/customers/${customer.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
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
                      <span className="block max-w-[220px] truncate">
                        {customer.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={customer.is_approved ? "default" : "secondary"}
                      >
                        {customer.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
