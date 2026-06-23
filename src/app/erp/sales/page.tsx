import { Download, Plus, Printer, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSaleAction } from "@/app/erp/sales/actions";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { session, companyId } = await requireTenant();
  const [company, invoices, revenue, payments, customers, customerOptions, products] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } }),
    prisma.invoice.findMany({
      where: { companyId, deletedAt: null },
      include: { customer: true, payments: true, items: { include: { product: true } } },
      orderBy: { issueDate: "desc" },
      take: 80
    }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true }),
    prisma.customer.count({ where: { companyId, deletedAt: null } }),
    prisma.customer.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: "asc" }, take: 200 }),
    prisma.product.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" }, take: 300 })
  ]);
  const currency = company?.defaultCurrency ?? "USD";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Sales" description="Tenant revenue pipeline from invoices and collected payments." icon={TrendingUp} />
        <MetricGrid
          metrics={[
            { label: "Sales Documents", value: revenue._count.toLocaleString(), icon: TrendingUp, detail: "Invoices" },
            { label: "Revenue", value: formatMoney(Number(revenue._sum.total ?? 0), currency), icon: TrendingUp, detail: "Invoice total" },
            { label: "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), currency), icon: TrendingUp, detail: `${payments._count} payments` },
            { label: "Customers", value: customers.toLocaleString(), icon: TrendingUp, detail: "Active accounts" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSaleAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <select name="customerId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="">Walk-in customer</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <Input name="paymentMethod" placeholder="Payment method" defaultValue="Cash" />
                <Input name="paidAmount" type="number" step="0.01" min="0" placeholder="Paid amount" defaultValue="0" />
              </div>
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1.5fr_0.5fr_0.7fr_0.6fr_0.6fr]">
                  <select name={`items.${index}.productId`} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatMoney(Number(product.price), currency)}
                      </option>
                    ))}
                  </select>
                  <Input name={`items.${index}.quantity`} type="number" step="0.001" min="0" placeholder="Qty" />
                  <Input name={`items.${index}.price`} type="number" step="0.01" min="0" placeholder="Price" />
                  <Input name={`items.${index}.discount`} type="number" step="0.01" min="0" placeholder="Discount" />
                  <Input name={`items.${index}.taxRate`} type="number" step="0.01" min="0" placeholder="Tax %" />
                </div>
              ))}
              <Button type="submit">
                <Plus className="size-4" />
                Save Sale
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Invoice", "Customer", "Sold Items", "Date", "Total", "Paid", "Debt", "Status", "PDF / Print"]}
          rows={invoices.map((invoice) => {
            const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const debt = Math.max(Number(invoice.total) - paid, 0);
            return [
              invoice.number,
              invoice.customer?.name ?? "Walk-in",
              invoice.items.map((item) => `${item.description} x ${item.quantity.toString()}`).join(", ") || "-",
              invoice.issueDate.toLocaleDateString(),
              formatMoney(Number(invoice.total), invoice.currencyCode),
              formatMoney(paid, invoice.currencyCode),
              formatMoney(debt, invoice.currencyCode),
              <Badge key="status" variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "secondary"}>
                {invoice.status}
              </Badge>,
              <div key="actions" className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/erp/invoices/${invoice.id}/print`}>
                    <Printer className="size-4" />
                    Print
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/api/erp/invoices/${invoice.id}/pdf`}>
                    <Download className="size-4" />
                    PDF
                  </Link>
                </Button>
              </div>
            ];
          })}
        />
      </div>
    </AppShell>
  );
}
