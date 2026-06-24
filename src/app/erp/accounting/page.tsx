import { Calculator, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const { session, companyId } = await requireTenantPermission("accounting.read");
  const [company, revenue, payments, expenses, recentExpenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.expense.findMany({ where: { companyId, deletedAt: null }, include: { supplier: true }, orderBy: { expenseDate: "desc" }, take: 50 })
  ]);
  const income = Number(revenue._sum.total ?? 0);
  const spend = Number(expenses._sum.amount ?? 0);
  const isAr = normalizeLocale(company.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المحاسبة" : "Accounting"} description={isAr ? "نظرة عامة على الدخل والتحصيل النقدي ودفتر المصروفات." : "Income, cash collection and expense ledger overview."} icon={Calculator} />
        <MetricGrid
          metrics={[
            { label: isAr ? "الإيرادات" : "Revenue", value: formatMoney(income, company.defaultCurrency), icon: TrendingUp, detail: `${revenue._count} ${isAr ? "فواتير" : "invoices"}` },
            { label: isAr ? "المحصّل" : "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), company.defaultCurrency), icon: ReceiptText, detail: `${payments._count} ${isAr ? "دفعات" : "payments"}` },
            { label: isAr ? "المصروفات" : "Expenses", value: formatMoney(spend, company.defaultCurrency), icon: TrendingDown, detail: `${expenses._count} ${isAr ? "مصروفات" : "expenses"}` },
            { label: isAr ? "الصافي" : "Net", value: formatMoney(income - spend, company.defaultCurrency), icon: Calculator, detail: isAr ? "الإيرادات ناقص المصروفات" : "Invoice revenue minus expenses" }
          ]}
        />
        <DataTable
          headers={isAr ? ["التاريخ", "المورد", "التصنيف", "المبلغ"] : ["Date", "Supplier", "Category", "Amount"]}
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
