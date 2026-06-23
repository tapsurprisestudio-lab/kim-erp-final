import { ReceiptText, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createExpenseAction, deleteExpenseAction } from "@/app/erp/expenses/actions";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const { session, companyId } = await requireTenant();
  const [expenses, aggregate, suppliers, company] = await Promise.all([
    prisma.expense.findMany({ where: { companyId, deletedAt: null }, include: { supplier: true }, orderBy: { expenseDate: "desc" }, take: 100 }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.supplier.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Expenses" description="Tenant spending records with supplier links and audit history." icon={ReceiptText} />
        <MetricGrid
          metrics={[
            { label: "Expenses", value: aggregate._count.toLocaleString(), icon: ReceiptText, detail: "Active records" },
            { label: "Spend", value: formatMoney(Number(aggregate._sum.amount ?? 0), company.defaultCurrency), icon: ReceiptText, detail: "Recorded expenses" },
            { label: "Suppliers", value: suppliers.length.toLocaleString(), icon: ReceiptText, detail: "Available vendors" },
            { label: "Currency", value: company.defaultCurrency, icon: ReceiptText, detail: "Default company currency" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Create expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createExpenseAction} className="grid gap-3 md:grid-cols-6">
              <select name="supplierId" className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">No supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <Input name="category" placeholder="Category" required />
              <Input name="description" placeholder="Description" />
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" required />
              <Input name="currencyCode" defaultValue={company.defaultCurrency} maxLength={3} required />
              <Input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              <Button type="submit" className="md:col-span-6">
                <Plus className="size-4" />
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Date", "Supplier", "Category", "Description", "Amount", "Actions"]}
          rows={expenses.map((expense) => [
            expense.expenseDate.toLocaleDateString(),
            expense.supplier?.name ?? "-",
            expense.category,
            expense.description ?? "-",
            formatMoney(Number(expense.amount), expense.currencyCode),
            <form key="delete" action={deleteExpenseAction}>
              <input type="hidden" name="id" value={expense.id} />
              <Button type="submit" size="sm" variant="outline">Delete</Button>
            </form>
          ])}
        />
      </div>
    </AppShell>
  );
}
