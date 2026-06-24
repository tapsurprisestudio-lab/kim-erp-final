import { FileText } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { session, companyId } = await requireTenantPermission("reports.read");
  const [company, invoices, quotations, receipts] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.quotation.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.receipt.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 40 })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";
  const documents = [
    ...invoices.map((invoice) => ({ type: isAr ? "فاتورة" : "Invoice", number: invoice.number, amount: Number(invoice.total), currency: invoice.currencyCode, date: invoice.createdAt, pdfUrl: invoice.pdfUrl })),
    ...quotations.map((quotation) => ({ type: isAr ? "عرض سعر" : "Quotation", number: quotation.number, amount: Number(quotation.total), currency: quotation.currencyCode, date: quotation.createdAt, pdfUrl: null })),
    ...receipts.map((receipt) => ({ type: isAr ? "إيصال" : "Receipt", number: receipt.number, amount: Number(receipt.amount), currency: receipt.currencyCode, date: receipt.createdAt, pdfUrl: receipt.pdfUrl }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 100);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المستندات" : "Documents"} description={isAr ? "الفواتير وعروض الأسعار والإيصالات المحفوظة لهذه الشركة." : "Invoices, quotations and receipts stored for this tenant."} icon={FileText} />
        <MetricGrid metrics={[
          { label: isAr ? "المستندات" : "Documents", value: documents.length.toLocaleString(), icon: FileText, detail: isAr ? "آخر مستندات الأعمال" : "Recent business documents" },
          { label: isAr ? "الفواتير" : "Invoices", value: invoices.length.toLocaleString(), icon: FileText, detail: isAr ? "مستندات المبيعات" : "Sales documents" },
          { label: isAr ? "عروض الأسعار" : "Quotations", value: quotations.length.toLocaleString(), icon: FileText, detail: isAr ? "مستندات العروض" : "Offer documents" },
          { label: isAr ? "الإيصالات" : "Receipts", value: receipts.length.toLocaleString(), icon: FileText, detail: isAr ? "مستندات الدفع" : "Payment documents" }
        ]} />
        <DataTable
          headers={isAr ? ["النوع", "الرقم", "المبلغ", "PDF", "التاريخ"] : ["Type", "Number", "Amount", "PDF", "Date"]}
          rows={documents.map((document) => [
            document.type,
            document.number,
            formatMoney(document.amount, document.currency),
            document.pdfUrl ? (isAr ? "تم الإنشاء" : "Generated") : (isAr ? "غير منشأ" : "Not generated"),
            document.date.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
