import { ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const { session, companyId } = await requireTenant();
  const [expenses, spend, suppliers, stockPurchases] = await Promise.all([
    prisma.expense.findMany({ where: { companyId, deletedAt: null }, include: { supplier: true }, orderBy: { expenseDate: "desc" }, take: 100 }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.supplier.count({ where: { companyId, deletedAt: null } }),
    prisma.stockMovement.count({ where: { companyId, deletedAt: null, type: "PURCHASE" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Purchases" description="Purchase-side activity from supplier expenses and purchase stock movements." icon={ShoppingCart} />
        <MetricGrid
          metrics={[
            { label: "Purchase Records", value: spend._count.toLocaleString(), icon: ShoppingCart, detail: "Expense-backed purchases" },
            { label: "Spend", value: formatMoney(Number(spend._sum.amount ?? 0), "LYD"), icon: ShoppingCart, detail: "Supplier and operational costs" },
            { label: "Suppliers", value: suppliers.toLocaleString(), icon: ShoppingCart, detail: "Vendor base" },
            { label: "Stock Purchases", value: stockPurchases.toLocaleString(), icon: ShoppingCart, detail: "Inventory movement entries" }
          ]}
        />
        <DataTable
          headers={["Date", "Supplier", "Category", "Amount", "Description"]}
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
