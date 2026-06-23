import { Ruler, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteUnitAction, saveUnitAction } from "@/app/erp/units/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const { session, companyId } = await requireTenantPermission("units.manage");
  const units = await prisma.unit.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" }
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Units" description="Manage tenant product units such as PCS, KG, box, hour, or service." icon={Ruler} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveUnitAction} className="grid max-w-xl gap-3 sm:grid-cols-[1fr_0.6fr_auto]">
            <Input name="name" placeholder="Pieces" required />
            <Input name="code" placeholder="PCS" required />
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Unit</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{unit.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{unit.code}</td>
                  <td className="px-5 py-4">
                    <Badge variant={unit.active ? "success" : "secondary"}>{unit.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <form action={saveUnitAction} className="flex gap-2">
                      <input type="hidden" name="id" value={unit.id} />
                      <Input name="name" defaultValue={unit.name} className="h-9 max-w-40" />
                      <Input name="code" defaultValue={unit.code} className="h-9 max-w-24" />
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteUnitAction}>
                      <input type="hidden" name="id" value={unit.id} />
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
