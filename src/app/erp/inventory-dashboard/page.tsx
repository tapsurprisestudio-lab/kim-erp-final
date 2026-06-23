import { Boxes, Package, TriangleAlert, Warehouse } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function InventoryDashboardPage() {
  const { session, companyId } = await requireTenantPermission("inventory.manage");
  const [products, warehouses, items, movements] = await Promise.all([
    prisma.product.count({ where: { companyId, deletedAt: null } }),
    prisma.warehouse.count({ where: { companyId, deletedAt: null } }),
    prisma.inventoryItem.findMany({
      where: { deletedAt: null, product: { companyId, deletedAt: null } },
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
      take: 20
    }),
    prisma.stockMovement.count({ where: { companyId, deletedAt: null } })
  ]);
  const lowStock = items.filter((item) => Number(item.quantity) <= Number(item.reorderPoint));
  const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <SectionHeader title="Inventory Dashboard" description="Live tenant stock health, low-stock alerts, and movement volume." icon={Boxes} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Products", products, Package],
          ["Warehouses", warehouses, Warehouse],
          ["Stock Units", totalUnits, Boxes],
          ["Low Stock", lowStock.length, TriangleAlert]
        ].map(([label, value, Icon]) => {
          const KpiIcon = Icon as typeof Boxes;
          return (
            <Card key={String(label)}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">{String(label)}</p>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{String(value)}</div>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                  <KpiIcon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <div className="font-medium text-slate-800">{item.product.name}</div>
                  <div className="text-xs text-slate-500">{item.warehouse.name}</div>
                </div>
                <Badge variant={Number(item.quantity) <= Number(item.reorderPoint) ? "warning" : "success"}>{item.quantity.toString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Movement Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-slate-50 p-6">
              <div className="text-4xl font-bold text-slate-950">{movements}</div>
              <p className="mt-2 text-sm text-slate-500">Total stock movements recorded for this tenant.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
