import { ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const { session, companyId } = await requireTenantPermission("purchases.read");
  const [company, expenses, spend, suppliers, stockPurchases] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.expense.findMany({ where: { companyId, deletedAt: null }, include: { supplier: true }, orderBy: { expenseDate: "desc" }, take: 100 }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.supplier.count({ where: { companyId, deletedAt: null } }),
    prisma.stockMovement.count({ where: { companyId, deletedAt: null, type: "PURCHASE" } })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المشتريات" : "Purchases"} description={isAr ? "نشاط المشتريات من مصروفات الموردين وحركات شراء المخزون." : "Purchase-side activity from supplier expenses and purchase stock movements."} icon={ShoppingCart} />
        <MetricGrid
          metrics={[
            { label: isAr ? "سجلات الشراء" : "Purchase Records", value: spend._count.toLocaleString(), icon: ShoppingCart, detail: isAr ? "مشتريات مرتبطة بالمصروفات" : "Expense-backed purchases" },
            { label: isAr ? "الإنفاق" : "Spend", value: formatMoney(Number(spend._sum.amount ?? 0), "LYD"), icon: ShoppingCart, detail: isAr ? "تكاليف الموردين والتشغيل" : "Supplier and operational costs" },
            { label: isAr ? "الموردون" : "Suppliers", value: suppliers.toLocaleString(), icon: ShoppingCart, detail: isAr ? "قاعدة الموردين" : "Vendor base" },
            { label: isAr ? "مشتريات المخزون" : "Stock Purchases", value: stockPurchases.toLocaleString(), icon: ShoppingCart, detail: isAr ? "حركات مخزونية" : "Inventory movement entries" }
          ]}
        />
        <DataTable
          headers={isAr ? ["التاريخ", "المورد", "التصنيف", "المبلغ", "الوصف"] : ["Date", "Supplier", "Category", "Amount", "Description"]}
          rows={expenses.map((expense) => [
            expense.expenseDate.toLocaleDateString(),
            expense.supplier?.name ?? "-",
            expense.category,
            formatMoney(Number(expense.amount), expense.currencyCode),
            expense.description ?? "-"
          ])}
        />
      </div>
    </AppShell>
  );
}
