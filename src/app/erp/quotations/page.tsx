import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const { session, companyId } = await requireTenant();
  const [quotations, totals, sentCount, draftCount] = await Promise.all([
    prisma.quotation.findMany({ where: { companyId, deletedAt: null }, include: { customer: true, _count: { select: { items: true } } }, orderBy: { issueDate: "desc" }, take: 100 }),
    prisma.quotation.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.quotation.count({ where: { companyId, deletedAt: null, status: "SENT" } }),
    prisma.quotation.count({ where: { companyId, deletedAt: null, status: "DRAFT" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Quotations" description="Customer offers and pre-sales document tracking." icon={ClipboardList} />
        <MetricGrid
          metrics={[
            { label: "Quotations", value: totals._count.toLocaleString(), icon: ClipboardList, detail: "Active records" },
            { label: "Quoted Value", value: formatMoney(Number(totals._sum.total ?? 0), "LYD"), icon: ClipboardList, detail: "Pipeline estimate" },
            { label: "Sent", value: sentCount.toLocaleString(), icon: ClipboardList, detail: "Customer-facing offers" },
            { label: "Drafts", value: draftCount.toLocaleString(), icon: ClipboardList, detail: "In preparation" }
          ]}
        />
        <DataTable
          headers={["Number", "Customer", "Issue Date", "Expires", "Total", "Status", "Lines"]}
          rows={quotations.map((quotation) => [
            quotation.number,
            quotation.customer?.name ?? "-",
            quotation.issueDate.toLocaleDateString(),
            quotation.expiresAt?.toLocaleDateString() ?? "-",
            formatMoney(Number(quotation.total), quotation.currencyCode),
            <Badge key="status" variant={quotation.status === "SENT" ? "success" : "secondary"}>
              {quotation.status}
            </Badge>,
            quotation._count.items.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
