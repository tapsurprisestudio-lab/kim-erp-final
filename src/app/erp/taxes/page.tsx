import { BadgeDollarSign } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const { session, companyId } = await requireTenantPermission("accounting.read");
  const [company, invoices] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, include: { customer: true }, orderBy: { issueDate: "desc" }, take: 100 })
  ]);
  const taxTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.taxTotal), 0);
  const isAr = normalizeLocale(company.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "الضرائب" : "Taxes"} description={isAr ? "إجماليات ضرائب الفواتير وتتبع المستندات الضريبية." : "Invoice tax totals and fiscal document tracking."} icon={BadgeDollarSign} />
        <MetricGrid metrics={[
          { label: isAr ? "إجمالي الضريبة" : "Tax Total", value: formatMoney(taxTotal, company.defaultCurrency), icon: BadgeDollarSign, detail: isAr ? "من فواتير المبيعات" : "From sales invoices" },
          { label: isAr ? "الفواتير" : "Invoices", value: invoices.length.toLocaleString(), icon: BadgeDollarSign, detail: isAr ? "مستندات خاضعة للضريبة" : "Taxable documents" },
          { label: isAr ? "الرقم الضريبي" : "Tax Number", value: company.taxNumber ?? "-", icon: BadgeDollarSign, detail: isAr ? "معرّف الشركة الضريبي" : "Company fiscal ID" },
          { label: isAr ? "العملة" : "Currency", value: company.defaultCurrency, icon: BadgeDollarSign, detail: isAr ? "عملة التقارير الضريبية" : "Tax reporting currency" }
        ]} />
        <DataTable
          headers={isAr ? ["الفاتورة", "العميل", "المجموع الفرعي", "الضريبة", "الإجمالي"] : ["Invoice", "Customer", "Subtotal", "Tax", "Total"]}
          rows={invoices.map((invoice) => [
            invoice.number,
            invoice.customer?.name ?? "-",
            formatMoney(Number(invoice.subtotal), invoice.currencyCode),
            formatMoney(Number(invoice.taxTotal), invoice.currencyCode),
            formatMoney(Number(invoice.total), invoice.currencyCode)
          ])}
        />
      </div>
    </AppShell>
  );
}
