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
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const { session, companyId } = await requireTenantPermission("sales.read");
  const [company, invoices, revenue, payments, customers, customerOptions, products] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true, defaultLanguage: true } }),
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
  const locale = normalizeLocale(company?.defaultLanguage);
  const isAr = locale === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader
          title={isAr ? "المبيعات" : "Sales"}
          description={isAr ? "أنشئ عملية بيع، اختر العميل والمنتجات، أدخل المدفوع، ثم اطبع الفاتورة." : "Create a sale, choose customer/products, enter the paid amount, then print the invoice."}
          icon={TrendingUp}
        />
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-950">
            {isAr
              ? "بعد حفظ البيع ستظهر الفاتورة في سجل المبيعات وقائمة الفواتير، وسيتم تخفيض المخزون تلقائيا إذا كان للمنتج رصيد."
              : "After saving a sale, the invoice appears in sales history and invoices. Inventory decreases automatically when stock exists."}
          </CardContent>
        </Card>
        <MetricGrid
          metrics={[
            { label: isAr ? "مستندات البيع" : "Sales Documents", value: revenue._count.toLocaleString(), icon: TrendingUp, detail: isAr ? "فواتير" : "Invoices" },
            { label: isAr ? "الإيرادات" : "Revenue", value: formatMoney(Number(revenue._sum.total ?? 0), currency), icon: TrendingUp, detail: isAr ? "إجمالي الفواتير" : "Invoice total" },
            { label: isAr ? "المحصّل" : "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), currency), icon: TrendingUp, detail: `${payments._count} ${isAr ? "دفعات" : "payments"}` },
            { label: isAr ? "العملاء" : "Customers", value: customers.toLocaleString(), icon: TrendingUp, detail: isAr ? "حسابات نشطة" : "Active accounts" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "عملية بيع جديدة" : "New Sale"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSaleAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <select name="customerId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="">{isAr ? "عميل مباشر" : "Walk-in customer"}</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <Input name="paymentMethod" placeholder={isAr ? "طريقة الدفع" : "Payment method"} defaultValue={isAr ? "نقدا" : "Cash"} />
                <Input name="paidAmount" type="number" step="0.01" min="0" placeholder={isAr ? "المبلغ المدفوع" : "Paid amount"} defaultValue="0" />
              </div>
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1.5fr_0.5fr_0.7fr_0.6fr_0.6fr]">
                  <select name={`items.${index}.productId`} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                    <option value="">{isAr ? "اختر منتجا" : "Select product"}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatMoney(Number(product.price), currency)}
                      </option>
                    ))}
                  </select>
                  <Input name={`items.${index}.quantity`} type="number" step="0.001" min="0" placeholder={isAr ? "الكمية" : "Qty"} />
                  <Input name={`items.${index}.price`} type="number" step="0.01" min="0" placeholder={isAr ? "السعر" : "Price"} />
                  <Input name={`items.${index}.discount`} type="number" step="0.01" min="0" placeholder={isAr ? "الخصم" : "Discount"} />
                  <Input name={`items.${index}.taxRate`} type="number" step="0.01" min="0" placeholder={isAr ? "الضريبة %" : "Tax %"} />
                </div>
              ))}
              <Button type="submit">
                <Plus className="size-4" />
                {isAr ? "حفظ البيع" : "Save Sale"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={isAr ? ["الفاتورة", "العميل", "المنتجات المباعة", "التاريخ", "الإجمالي", "المدفوع", "الدين", "الحالة", "PDF / طباعة"] : ["Invoice", "Customer", "Sold Items", "Date", "Total", "Paid", "Debt", "Status", "PDF / Print"]}
          rows={invoices.map((invoice) => {
            const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const debt = Math.max(Number(invoice.total) - paid, 0);
            return [
              invoice.number,
              invoice.customer?.name ?? (isAr ? "عميل مباشر" : "Walk-in"),
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
                    {isAr ? "طباعة" : "Print"}
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
