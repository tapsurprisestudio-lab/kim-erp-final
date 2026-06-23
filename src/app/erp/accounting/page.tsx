import { Calculator, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const { session, companyId } = await requireTenant();
  const [company, revenue, payments, expenses, recentExpenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.expense.findMany({ where: { companyId, deletedAt: null }, include: { supplier: true }, orderBy: { expenseDate: "desc" }, take: 50 })
  ]);
  const income = Number(revenue._sum.total ?? 0);
  const spend = Number(expenses._sum.amount ?? 0);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Accounting" description="Income, cash collection and expense ledger overview." icon={Calculator} />
        <MetricGrid
          metrics={[
            { label: "Revenue", value: formatMoney(income, company.defaultCurrency), icon: TrendingUp, detail: `${revenue._count} invoices` },
            { label: "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), company.defaultCurrency), icon: ReceiptText, detail: `${payments._count} payments` },
            { label: "Expenses", value: formatMoney(spend, company.defaultCurrency), icon: TrendingDown, detail: `${expenses._count} expenses` },
            { label: "Net", value: formatMoney(income - spend, company.defaultCurrency), icon: Calculator, detail: "Invoice revenue minus expenses" }
          ]}
        />
        <DataTable
          headers={["Date", "Supplier", "Category", "Amount"]}
          rows={recentExpenses.map((expense) => [
            expense.expenseDate.toLocaleDateString(),
            expense.supplier?.name ?? "-",
            expense.category,
            formatMoney(Number(expense.amount), expense.currencyCode)
          ])}
        />
      </div>
    </AppShell>
  );
}
