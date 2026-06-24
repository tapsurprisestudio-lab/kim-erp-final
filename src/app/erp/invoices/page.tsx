import { FileText } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantInvoicesPage() {
  const { session, companyId } = await requireTenantPermission("invoices.manage");
  const [company, invoices, totals, paidCount, overdueCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, include: { customer: true, _count: { select: { items: true, payments: true } } }, orderBy: { issueDate: "desc" }, take: 100 }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.invoice.count({ where: { companyId, deletedAt: null, status: "PAID" } }),
    prisma.invoice.count({ where: { companyId, deletedAt: null, status: "OVERDUE" } })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "الفواتير" : "Invoices"} description={isAr ? "فواتير المبيعات وحالة الدفع وإجماليات المستندات لهذه الشركة." : "Sales invoices, payment status and document totals for this tenant."} icon={FileText} />
        <MetricGrid
          metrics={[
            { label: isAr ? "الفواتير" : "Invoices", value: totals._count.toLocaleString(), icon: FileText, detail: isAr ? "سجلات نشطة" : "Active records" },
            { label: isAr ? "الإجمالي" : "Total", value: formatMoney(Number(totals._sum.total ?? 0), "LYD"), icon: FileText, detail: isAr ? "قيمة الفواتير" : "Invoice value" },
            { label: isAr ? "مدفوعة" : "Paid", value: paidCount.toLocaleString(), icon: FileText, detail: isAr ? "فواتير مسددة" : "Settled invoices" },
            { label: isAr ? "متأخرة" : "Overdue", value: overdueCount.toLocaleString(), icon: FileText, detail: isAr ? "تحتاج متابعة" : "Needs follow-up" }
          ]}
        />
        <DataTable
          headers={isAr ? ["الرقم", "العميل", "تاريخ الإصدار", "تاريخ الاستحقاق", "الإجمالي", "الحالة", "البنود", "PDF / طباعة"] : ["Number", "Customer", "Issue Date", "Due Date", "Total", "Status", "Lines", "PDF / Print"]}
          rows={invoices.map((invoice) => [
            invoice.number,
            invoice.customer?.name ?? "-",
            invoice.issueDate.toLocaleDateString(),
            invoice.dueDate?.toLocaleDateString() ?? "-",
            formatMoney(Number(invoice.total), invoice.currencyCode),
            <Badge key="status" variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "secondary"}>
              {invoice.status}
            </Badge>,
            isAr ? `${invoice._count.items} بنود / ${invoice._count.payments} دفعات` : `${invoice._count.items} items / ${invoice._count.payments} payments`,
            <div key="actions" className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/erp/invoices/${invoice.id}/print`}>{isAr ? "طباعة" : "Print"}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/api/erp/invoices/${invoice.id}/pdf`}>{isAr ? "تنزيل PDF" : "Download PDF"}</Link>
              </Button>
            </div>
          ])}
        />
      </div>
    </AppShell>
  );
}
