import { Building2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createWarehouseAction, deleteWarehouseAction, toggleWarehouseAction, updateWarehouseAction } from "@/app/erp/warehouses/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const { session, companyId } = await requireTenantPermission("warehouses.manage");
  const warehouses = await prisma.warehouse.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { inventoryItems: true, movements: true } } }
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Warehouses" description="Manage tenant storage locations and inventory points." icon={Building2} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createWarehouseAction} className="grid gap-3 md:grid-cols-[0.7fr_1fr_1.4fr_auto]">
            <Input name="code" placeholder="MAIN" required />
            <Input name="name" placeholder="Main Warehouse" required />
            <Input name="address" placeholder="Tripoli" />
            <Button type="submit">
              <Plus className="size-4" />
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Inventory Items</th>
                <th className="px-5 py-3">Movements</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{warehouse.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{warehouse.code}</td>
                  <td className="px-5 py-4 text-slate-500">{warehouse._count.inventoryItems}</td>
                  <td className="px-5 py-4 text-slate-500">{warehouse._count.movements}</td>
                  <td className="px-5 py-4">
                    <Badge variant={warehouse.active ? "success" : "secondary"}>{warehouse.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <form action={updateWarehouseAction} className="grid min-w-[420px] grid-cols-[0.5fr_1fr_1fr_auto] gap-2">
                      <input type="hidden" name="id" value={warehouse.id} />
                      <Input name="code" defaultValue={warehouse.code} className="h-9" />
                      <Input name="name" defaultValue={warehouse.name} className="h-9" />
                      <Input name="address" defaultValue={warehouse.address ?? ""} className="h-9" />
                      <Button type="submit" size="sm" variant="outline">Save</Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={toggleWarehouseAction} className="mb-2 inline-flex">
                      <input type="hidden" name="id" value={warehouse.id} />
                      <input type="hidden" name="active" value={String(!warehouse.active)} />
                      <Button type="submit" size="sm" variant="outline">
                        {warehouse.active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteWarehouseAction} className="inline-flex">
                      <input type="hidden" name="id" value={warehouse.id} />
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
