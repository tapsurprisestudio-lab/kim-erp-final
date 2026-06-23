import { Boxes, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteInventoryAction, upsertInventoryAction } from "@/app/erp/inventory/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { session, companyId } = await requireTenantPermission("inventory.manage");
  const [items, products, warehouses] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { deletedAt: null, product: { companyId, deletedAt: null }, warehouse: { companyId, deletedAt: null } },
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    }),
    prisma.product.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <SectionHeader title="Inventory" description="Set and monitor stock levels by product and warehouse." icon={Boxes} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Set Inventory Level</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertInventoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto]">
            <select name="productId" required className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select name="warehouseId" required className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <Input name="quantity" type="number" step="0.001" placeholder="100" required />
            <Input name="reorderPoint" type="number" step="0.001" placeholder="10" defaultValue="0" />
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Reorder Point</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const low = Number(item.quantity) <= Number(item.reorderPoint);
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-medium text-slate-800">{item.product.name}</td>
                    <td className="px-5 py-4 text-slate-500">{item.warehouse.name}</td>
                    <td className="px-5 py-4 text-slate-500">{item.quantity.toString()}</td>
                    <td className="px-5 py-4 text-slate-500">{item.reorderPoint.toString()}</td>
                    <td className="px-5 py-4">
                      <Badge variant={low ? "warning" : "success"}>{low ? "Low Stock" : "Healthy"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <form action={upsertInventoryAction} className="flex gap-2">
                        <input type="hidden" name="productId" value={item.productId} />
                        <input type="hidden" name="warehouseId" value={item.warehouseId} />
                        <Input name="quantity" type="number" step="0.001" defaultValue={item.quantity.toString()} className="h-9 max-w-28" />
                        <Input name="reorderPoint" type="number" step="0.001" defaultValue={item.reorderPoint.toString()} className="h-9 max-w-28" />
                        <Button type="submit" size="sm" variant="outline">Save</Button>
                      </form>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={deleteInventoryAction}>
                        <input type="hidden" name="id" value={item.id} />
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
