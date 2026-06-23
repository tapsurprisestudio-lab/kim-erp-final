import { Package, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createProductAction, deleteProductAction, toggleProductAction, updateProductAction } from "@/app/erp/products/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { category: true, inventoryItems: true },
      take: 100
    }),
    prisma.category.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <SectionHeader title="Products" description="Tenant-scoped product catalog with SKU uniqueness per company." icon={Package} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add or Update Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="grid gap-3 lg:grid-cols-4">
            <Input name="sku" placeholder="SKU / code (optional)" />
            <Input name="name" placeholder="iPhone 15 Pro" required />
            <select name="categoryId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input name="unit" placeholder="Unit (optional)" />
            <Input name="price" type="number" step="0.01" placeholder="Sale price (optional)" />
            <Input name="cost" type="number" step="0.01" placeholder="Purchase price (optional)" />
            <Input name="taxRate" type="number" step="0.01" placeholder="Tax % (optional)" />
            <Input name="description" placeholder="Description" />
            <div className="lg:col-span-4">
              <Button type="submit">
                <Plus className="size-4" />
                Save Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const stock = product.inventoryItems.reduce((sum, item) => sum + Number(item.quantity), 0);
                return (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="px-5 py-4 text-slate-500">{product.category?.name ?? "-"}</td>
                    <td className="px-5 py-4 text-slate-500">{product.price.toString()}</td>
                    <td className="px-5 py-4 text-slate-500">{stock}</td>
                    <td className="px-5 py-4">
                      <Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateProductAction} className="grid min-w-[540px] grid-cols-[0.8fr_1fr_0.9fr_0.5fr_0.6fr_auto] gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <Input name="sku" defaultValue={product.sku} className="h-9" />
                        <Input name="name" defaultValue={product.name} className="h-9" />
                        <select name="categoryId" defaultValue={product.categoryId ?? ""} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                          <option value="">No category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <Input name="unit" defaultValue={product.unit} className="h-9" />
                        <Input name="price" type="number" step="0.01" defaultValue={product.price.toString()} className="h-9" />
                        <input type="hidden" name="cost" value={product.cost.toString()} />
                        <input type="hidden" name="taxRate" value={product.taxRate.toString()} />
                        <input type="hidden" name="description" value={product.description ?? ""} />
                        <Button type="submit" size="sm" variant="outline">Save</Button>
                      </form>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={toggleProductAction} className="mb-2 inline-flex">
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="active" value={String(!product.active)} />
                        <Button type="submit" size="sm" variant="outline">{product.active ? "Disable" : "Enable"}</Button>
                      </form>
                      <form action={deleteProductAction} className="inline-flex">
                        <input type="hidden" name="id" value={product.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
