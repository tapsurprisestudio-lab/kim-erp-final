import { Download, ReceiptText } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const { session, companyId } = await requireTenantPermission("invoices.manage");
  const [company, receipts, aggregate] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.receipt.findMany({ where: { companyId }, include: { customer: true, invoice: true }, orderBy: { issuedAt: "desc" }, take: 100 }),
    prisma.receipt.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "الإيصالات" : "Receipts"} description={isAr ? "سجل إيصالات العملاء ومستندات تأكيد الدفع القابلة للطباعة." : "Customer receipt history and printable payment acknowledgements."} icon={ReceiptText} />
        <MetricGrid metrics={[
          { label: isAr ? "الإيصالات" : "Receipts", value: aggregate._count.toLocaleString(), icon: ReceiptText, detail: isAr ? "مستندات صادرة" : "Issued documents" },
          { label: isAr ? "المبلغ" : "Amount", value: formatMoney(Number(aggregate._sum.amount ?? 0), "LYD"), icon: ReceiptText, detail: isAr ? "إجمالي الإيصالات" : "Receipt total" },
          { label: isAr ? "ملفات PDF" : "With PDF", value: receipts.filter((receipt) => receipt.pdfUrl).length.toLocaleString(), icon: ReceiptText, detail: isAr ? "ملفات مولدة" : "Generated files" },
          { label: isAr ? "العملاء" : "Customers", value: new Set(receipts.map((receipt) => receipt.customerId).filter(Boolean)).size.toLocaleString(), icon: ReceiptText, detail: isAr ? "مستلمو الإيصالات" : "Receipt recipients" }
        ]} />
        <DataTable
          headers={isAr ? ["الرقم", "العميل", "الفاتورة", "المبلغ", "تاريخ الإصدار", "PDF"] : ["Number", "Customer", "Invoice", "Amount", "Issued", "PDF"]}
          rows={receipts.map((receipt) => [
            receipt.number,
            receipt.customer?.name ?? "-",
            receipt.invoice?.number ?? "-",
            formatMoney(Number(receipt.amount), receipt.currencyCode),
            receipt.issuedAt.toLocaleString(),
            <Button key="pdf" size="sm" variant="outline" asChild>
              <Link href={`/api/erp/receipts/${receipt.id}/pdf`}>
                <Download className="size-4" />
                PDF
              </Link>
            </Button>
          ])}
        />
      </div>
    </AppShell>
  );
}
