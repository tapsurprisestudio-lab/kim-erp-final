import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const session = await requireSuperAdmin();
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      owner: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true }
      }
    }
  });

  return (
    <AppShell userName={session.user.name}>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Companies</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Manage client companies and subscriptions.</p>
          </div>
          <Button asChild>
            <Link href="/admin/companies/new">
              <Plus className="size-4" />
              Add Company
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg bg-slate-50 px-3">
            <Search className="size-4 text-slate-400" />
            <Input className="border-0 bg-transparent focus-visible:ring-0" placeholder="Search company..." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 font-semibold">Company</th>
                  <th className="py-3 font-semibold">Owner</th>
                  <th className="py-3 font-semibold">Plan</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Currency</th>
                  <th className="py-3 font-semibold">Language</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="py-4 font-medium text-slate-800">
                      <Link href={`/admin/companies/${company.id}`} className="text-primary hover:underline">
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-4 text-slate-500">{company.owner?.name ?? "Unassigned"}</td>
                    <td className="py-4 text-slate-500">{company.subscriptions[0]?.plan.name ?? "No plan"}</td>
                    <td className="py-4">
                      <Badge variant={company.status === "ACTIVE" ? "success" : company.status === "SUSPENDED" ? "danger" : "warning"}>
                        {company.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-slate-500">{company.defaultCurrency}</td>
                    <td className="py-4 text-slate-500">{company.defaultLanguage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
