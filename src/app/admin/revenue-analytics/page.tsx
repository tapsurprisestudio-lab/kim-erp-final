import { BadgeDollarSign, Banknote, FileText, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RevenueAnalyticsPage() {
  const session = await requireSuperAdmin();
  const [invoices, payments, billing, openBilling, recentBilling] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { deletedAt: null } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.billingRecord.aggregate({ _sum: { amount: true }, _count: true, where: { deletedAt: null } }),
    prisma.billingRecord.count({ where: { deletedAt: null, status: "OPEN" } }),
    prisma.billingRecord.findMany({
      where: { deletedAt: null },
      include: { company: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Revenue Analytics" description="Tenant sales activity and platform billing foundation." icon={BadgeDollarSign} />
        <MetricGrid
          metrics={[
            { label: "Invoice Revenue", value: formatMoney(Number(invoices._sum.total ?? 0), "LYD"), icon: FileText, detail: `${invoices._count.toLocaleString()} invoices` },
            { label: "Payments", value: formatMoney(Number(payments._sum.amount ?? 0), "LYD"), icon: ReceiptText, detail: `${payments._count.toLocaleString()} payments` },
            { label: "Billing Records", value: formatMoney(Number(billing._sum.amount ?? 0), "LYD"), icon: Banknote, detail: `${billing._count.toLocaleString()} platform records` },
            { label: "Open Billing", value: openBilling.toLocaleString(), icon: BadgeDollarSign, detail: "Awaiting collection" }
          ]}
        />
        <DataTable
          headers={["Number", "Company", "Plan", "Amount", "Status", "Due Date"]}
          rows={recentBilling.map((record) => [
            record.number,
            record.company.name,
            record.subscription.plan.name,
            formatMoney(Number(record.amount), record.currencyCode),
            <Badge key="status" variant={record.status === "PAID" ? "success" : "warning"}>
              {record.status}
            </Badge>,
            record.dueDate.toLocaleDateString()
          ])}
        />
      </div>
    </AppShell>
  );
}
