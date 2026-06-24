import { CreditCard, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPaymentAction } from "@/app/erp/payments/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantPaymentsPage() {
  const { session, companyId } = await requireTenantPermission("payments.manage");
  const [payments, aggregate, invoices, company] = await Promise.all([
    prisma.payment.findMany({ where: { companyId }, include: { invoice: true }, orderBy: { paidAt: "desc" }, take: 100 }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, orderBy: { issueDate: "desc" }, take: 100 }),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } })
  ]);
  const isAr = normalizeLocale(company.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المدفوعات" : "Payments"} description={isAr ? "تسجيل دفعات العملاء وربطها بفواتير المبيعات." : "Tenant payment capture connected to sales invoices."} icon={CreditCard} />
        <MetricGrid
          metrics={[
            { label: isAr ? "المدفوعات" : "Payments", value: aggregate._count.toLocaleString(), icon: CreditCard, detail: isAr ? "إيصالات مسجلة" : "Recorded receipts" },
            { label: isAr ? "المحصّل" : "Collected", value: formatMoney(Number(aggregate._sum.amount ?? 0), company.defaultCurrency), icon: CreditCard, detail: isAr ? "إجمالي المدفوعات" : "Tenant payment total" },
            { label: isAr ? "الفواتير" : "Invoices", value: invoices.length.toLocaleString(), icon: CreditCard, detail: isAr ? "فواتير متاحة للربط" : "Available invoice links" },
            { label: isAr ? "العملة" : "Currency", value: company.defaultCurrency, icon: CreditCard, detail: isAr ? "عملة الشركة الافتراضية" : "Default company currency" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "تسجيل دفعة" : "Record payment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPaymentAction} className="grid gap-3 md:grid-cols-5">
              <select name="invoiceId" className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">{isAr ? "دفعة مباشرة" : "Direct payment"}</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number}
                  </option>
                ))}
              </select>
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder={isAr ? "المبلغ" : "Amount"} required />
              <Input name="currencyCode" defaultValue={company.defaultCurrency} maxLength={3} required />
              <Input name="method" placeholder={isAr ? "طريقة الدفع" : "Method"} required />
              <Input name="reference" placeholder={isAr ? "المرجع" : "Reference"} />
              <Button type="submit" className="md:col-span-5">
                <Plus className="size-4" />
                {isAr ? "تسجيل الدفعة" : "Record Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={isAr ? ["الفاتورة", "المبلغ", "الطريقة", "المرجع", "تاريخ الدفع"] : ["Invoice", "Amount", "Method", "Reference", "Paid At"]}
          rows={payments.map((payment) => [
            payment.invoice?.number ?? (isAr ? "دفعة مباشرة" : "Direct payment"),
            formatMoney(Number(payment.amount), payment.currencyCode),
            payment.method,
            payment.reference ?? "-",
            payment.paidAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
