import { Activity, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createStockMovementAction, deleteStockMovementAction } from "@/app/erp/stock-movements/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const movementTypes = ["ADJUSTMENT", "PURCHASE", "SALE", "TRANSFER", "RETURN"];

export default async function StockMovementsPage() {
  const { session, companyId } = await requireTenantPermission("stock_movements.manage");
  const [movements, products, warehouses] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { companyId, deletedAt: null },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.product.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Stock Movements" description="Record purchases, sales, returns, transfers, and adjustments." icon={Activity} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Record Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStockMovementAction} className="grid gap-3 lg:grid-cols-3">
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
            <select name="type" required className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {movementTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Input name="quantity" type="number" step="0.001" placeholder="10" required />
            <Input name="reference" placeholder="PO-1001" />
            <Input name="note" placeholder="Notes" />
            <div className="lg:col-span-3">
              <Button type="submit">Record Movement</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-5 py-4">
                    <Badge variant={movement.type === "SALE" || movement.type === "TRANSFER" ? "warning" : "success"}>{movement.type}</Badge>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">{movement.product.name}</td>
                  <td className="px-5 py-4 text-slate-500">{movement.warehouse.name}</td>
                  <td className="px-5 py-4 text-slate-500">{movement.quantity.toString()}</td>
                  <td className="px-5 py-4 text-slate-500">{movement.reference ?? "-"}</td>
                  <td className="px-5 py-4 text-slate-500">{movement.createdAt.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteStockMovementAction}>
                      <input type="hidden" name="id" value={movement.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
