import { Receipt } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const session = await requireSuperAdmin();
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { company: true, customer: true },
    take: 100
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Invoices" description="Platform-level invoice visibility across tenants." icon={Receipt} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{invoice.number}</td>
                  <td className="px-5 py-4 text-slate-500">{invoice.company.name}</td>
                  <td className="px-5 py-4 text-slate-500">{invoice.customer?.name ?? "-"}</td>
                  <td className="px-5 py-4">
                    <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {invoice.currencyCode} {invoice.total.toString()}
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
