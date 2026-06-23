import { TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { session, companyId } = await requireTenant();
  const [invoices, revenue, payments, customers] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, include: { customer: true }, orderBy: { issueDate: "desc" }, take: 80 }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true }),
    prisma.customer.count({ where: { companyId, deletedAt: null } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Sales" description="Tenant revenue pipeline from invoices and collected payments." icon={TrendingUp} />
        <MetricGrid
          metrics={[
            { label: "Sales Documents", value: revenue._count.toLocaleString(), icon: TrendingUp, detail: "Invoices" },
            { label: "Revenue", value: formatMoney(Number(revenue._sum.total ?? 0), "LYD"), icon: TrendingUp, detail: "Invoice total" },
            { label: "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), "LYD"), icon: TrendingUp, detail: `${payments._count} payments` },
            { label: "Customers", value: customers.toLocaleString(), icon: TrendingUp, detail: "Active accounts" }
          ]}
        />
        <DataTable
          headers={["Invoice", "Customer", "Date", "Total", "Status"]}
          rows={invoices.map((invoice) => [
            invoice.number,
            invoice.customer?.name ?? "-",
            invoice.issueDate.toLocaleDateString(),
            formatMoney(Number(invoice.total), invoice.currencyCode),
            <Badge key="status" variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "secondary"}>
              {invoice.status}
            </Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
