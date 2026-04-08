"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ROAST_LEVELS } from "@/lib/constants";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  origin: string;
  roast_level: string;
  flavor_notes: string[];
  process: string;
  base_price_cents: number;
  unit: string;
  min_order_qty: number;
  available_sizes: string[];
  is_active: boolean;
  sort_order: number;
}

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  slug: "",
  description: "",
  origin: "",
  roast_level: "medium",
  flavor_notes: [],
  process: "",
  base_price_cents: 0,
  unit: "lb",
  min_order_qty: 5,
  available_sizes: ["5lb", "25lb", "50lb"],
  is_active: true,
  sort_order: 0,
};

export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [flavorInput, setFlavorInput] = useState("");

  useEffect(() => {
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort_order");
    if (data) setProducts(data);
  }

  function openNew() {
    setEditing({ ...emptyProduct });
    setFlavorInput("");
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing({ ...product });
    setFlavorInput(product.flavor_notes?.join(", ") || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editing?.name) return;

    const slug =
      editing.slug ||
      editing.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const payload = {
      name: editing.name,
      slug,
      description: editing.description || "",
      origin: editing.origin || "",
      roast_level: editing.roast_level || "medium",
      flavor_notes: flavorInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      process: editing.process || "",
      base_price_cents: editing.base_price_cents || 0,
      unit: editing.unit || "lb",
      min_order_qty: editing.min_order_qty || 5,
      available_sizes: editing.available_sizes || ["5lb", "25lb", "50lb"],
      is_active: editing.is_active ?? true,
      sort_order: editing.sort_order || 0,
    };

    if (editing.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Failed to update product.");
        return;
      }
      toast.success("Product updated.");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast.error("Failed to create product.");
        return;
      }
      toast.success("Product created.");
    }

    setDialogOpen(false);
    setEditing(null);
    loadProducts();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Products
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={openNew} size="sm" className="sm:size-default">
                <Plus className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Button>
            }
          />
          <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editing?.id ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editing.name || ""}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Input
                      value={editing.origin || ""}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, origin: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Roast Level</Label>
                    <Select
                      value={editing.roast_level || "medium"}
                      onValueChange={(v) =>
                        setEditing((p) =>
                          p ? { ...p, roast_level: v ?? "medium" } : p
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROAST_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Process</Label>
                    <Input
                      value={editing.process || ""}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, process: e.target.value }))
                      }
                      placeholder="Washed, Natural..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price ($/lb)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={
                        editing.base_price_cents
                          ? (editing.base_price_cents / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          base_price_cents: Math.round(
                            parseFloat(e.target.value) * 100
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Flavor Notes (comma-separated)</Label>
                  <Input
                    value={flavorInput}
                    onChange={(e) => setFlavorInput(e.target.value)}
                    placeholder="Chocolate, Caramel, Walnut"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Order Qty</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editing.min_order_qty || 5}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          min_order_qty: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editing.sort_order || 0}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          sort_order: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editing.id ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base truncate">
                  {product.name}
                </p>
                {product.origin && (
                  <p className="text-sm text-muted-foreground truncate">
                    {product.origin}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(product)}
                aria-label={`Edit ${product.name}`}
                className="h-11 w-11 flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
              <span className="text-sm">
                <span className="font-medium">
                  ${(product.base_price_cents / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">/lb</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {product.roast_level}
                </span>
              </span>
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Roast</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.origin}</TableCell>
                <TableCell>{product.roast_level}</TableCell>
                <TableCell>
                  ${(product.base_price_cents / 100).toFixed(2)}/lb
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
