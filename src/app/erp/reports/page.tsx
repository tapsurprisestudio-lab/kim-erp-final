import { BarChart3, Boxes, FileText, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { session, companyId } = await requireTenant();
  const [company, customers, products, inventory, invoices, expenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.customer.count({ where: { companyId, deletedAt: null } }),
    prisma.product.count({ where: { companyId, deletedAt: null } }),
    prisma.inventoryItem.aggregate({ where: { deletedAt: null, product: { companyId, deletedAt: null } }, _sum: { quantity: true }, _count: true }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true })
  ]);
  const reports = [
    { name: "Revenue report", metric: formatMoney(Number(invoices._sum.total ?? 0), company.defaultCurrency), records: invoices._count },
    { name: "Inventory report", metric: Number(inventory._sum.quantity ?? 0).toLocaleString(), records: inventory._count },
    { name: "Customer report", metric: customers.toLocaleString(), records: customers },
    { name: "Expense report", metric: formatMoney(Number(expenses._sum.amount ?? 0), company.defaultCurrency), records: expenses._count }
  ];

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Reports" description="Tenant analytics snapshots for finance, inventory and customers." icon={BarChart3} />
        <MetricGrid
          metrics={[
            { label: "Customers", value: customers.toLocaleString(), icon: Users, detail: "Customer base" },
            { label: "Products", value: products.toLocaleString(), icon: Boxes, detail: "Catalog items" },
            { label: "Inventory Units", value: Number(inventory._sum.quantity ?? 0).toLocaleString(), icon: Boxes, detail: "On-hand quantity" },
            { label: "Revenue", value: formatMoney(Number(invoices._sum.total ?? 0), company.defaultCurrency), icon: FileText, detail: "Invoice total" }
          ]}
        />
        <DataTable
          headers={["Report", "Primary Metric", "Records"]}
          rows={reports.map((report) => [report.name, report.metric, report.records.toLocaleString()])}
        />
      </div>
    </AppShell>
  );
}
