import { Download, ReceiptText } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const { session, companyId } = await requireTenant();
  const [receipts, aggregate] = await Promise.all([
    prisma.receipt.findMany({ where: { companyId }, include: { customer: true, invoice: true }, orderBy: { issuedAt: "desc" }, take: 100 }),
    prisma.receipt.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Receipts" description="Customer receipt history and printable payment acknowledgements." icon={ReceiptText} />
        <MetricGrid metrics={[
          { label: "Receipts", value: aggregate._count.toLocaleString(), icon: ReceiptText, detail: "Issued documents" },
          { label: "Amount", value: formatMoney(Number(aggregate._sum.amount ?? 0), "LYD"), icon: ReceiptText, detail: "Receipt total" },
          { label: "With PDF", value: receipts.filter((receipt) => receipt.pdfUrl).length.toLocaleString(), icon: ReceiptText, detail: "Generated files" },
          { label: "Customers", value: new Set(receipts.map((receipt) => receipt.customerId).filter(Boolean)).size.toLocaleString(), icon: ReceiptText, detail: "Receipt recipients" }
        ]} />
        <DataTable
          headers={["Number", "Customer", "Invoice", "Amount", "Issued", "PDF"]}
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
