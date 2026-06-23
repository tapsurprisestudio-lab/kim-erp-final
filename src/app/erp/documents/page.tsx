import { FileText } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { session, companyId } = await requireTenant();
  const [invoices, quotations, receipts] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.quotation.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.receipt.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 40 })
  ]);
  const documents = [
    ...invoices.map((invoice) => ({ type: "Invoice", number: invoice.number, amount: Number(invoice.total), currency: invoice.currencyCode, date: invoice.createdAt, pdfUrl: invoice.pdfUrl })),
    ...quotations.map((quotation) => ({ type: "Quotation", number: quotation.number, amount: Number(quotation.total), currency: quotation.currencyCode, date: quotation.createdAt, pdfUrl: null })),
    ...receipts.map((receipt) => ({ type: "Receipt", number: receipt.number, amount: Number(receipt.amount), currency: receipt.currencyCode, date: receipt.createdAt, pdfUrl: receipt.pdfUrl }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 100);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Documents" description="Invoices, quotations and receipts stored for this tenant." icon={FileText} />
        <MetricGrid metrics={[
          { label: "Documents", value: documents.length.toLocaleString(), icon: FileText, detail: "Recent business documents" },
          { label: "Invoices", value: invoices.length.toLocaleString(), icon: FileText, detail: "Sales documents" },
          { label: "Quotations", value: quotations.length.toLocaleString(), icon: FileText, detail: "Offer documents" },
          { label: "Receipts", value: receipts.length.toLocaleString(), icon: FileText, detail: "Payment documents" }
        ]} />
        <DataTable
          headers={["Type", "Number", "Amount", "PDF", "Date"]}
          rows={documents.map((document) => [
            document.type,
            document.number,
            formatMoney(document.amount, document.currency),
            document.pdfUrl ? "Generated" : "Not generated",
            document.date.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
