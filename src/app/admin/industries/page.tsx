import { Building2, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createIndustryAction, toggleIndustryAction } from "@/app/admin/industries/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function IndustriesPage() {
  const session = await requireSuperAdmin();
  const industries = await prisma.industry.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { companies: true } } }
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Industries" description="Classify tenant companies for onboarding and reporting." icon={Building2} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add Industry</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createIndustryAction} className="flex max-w-lg gap-3">
            <Input name="name" placeholder="Healthcare" required />
            <Button type="submit">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Industry</th>
                <th className="px-5 py-3">Companies</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {industries.map((industry) => (
                <tr key={industry.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{industry.name}</td>
                  <td className="px-5 py-4 text-slate-500">{industry._count.companies}</td>
                  <td className="px-5 py-4">
                    <Badge variant={industry.active ? "success" : "secondary"}>{industry.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={toggleIndustryAction}>
                      <input type="hidden" name="id" value={industry.id} />
                      <input type="hidden" name="active" value={String(!industry.active)} />
                      <Button type="submit" size="sm" variant="outline">
                        {industry.active ? "Disable" : "Enable"}
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
