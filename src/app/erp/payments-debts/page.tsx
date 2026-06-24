import { WalletCards } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsDebtsPage() {
  const { session, companyId } = await requireTenantPermission("payments.manage");
  const [company, invoices, payments] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, include: { customer: true, payments: true }, orderBy: { dueDate: "asc" }, take: 100 }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true })
  ]);
  const debts = invoices.map((invoice) => {
    const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { invoice, paid, due: Math.max(Number(invoice.total) - paid, 0) };
  });
  const totalDue = debts.reduce((sum, item) => sum + item.due, 0);
  const isAr = normalizeLocale(company.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المدفوعات والديون" : "Payments & Debts"} description={isAr ? "تحصيل مدفوعات العملاء والأرصدة المستحقة." : "Customer payment collection and outstanding balances."} icon={WalletCards} />
        <MetricGrid
          metrics={[
            { label: isAr ? "المحصّل" : "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), company.defaultCurrency), icon: WalletCards, detail: `${payments._count} ${isAr ? "دفعات" : "payments"}` },
            { label: isAr ? "المستحق" : "Outstanding", value: formatMoney(totalDue, company.defaultCurrency), icon: WalletCards, detail: isAr ? "رصيد فواتير غير مدفوع" : "Unpaid invoice balance" },
            { label: isAr ? "الفواتير" : "Invoices", value: invoices.length.toLocaleString(), icon: WalletCards, detail: isAr ? "مستندات متابعة" : "Tracked documents" },
            { label: isAr ? "العملة" : "Currency", value: company.defaultCurrency, icon: WalletCards, detail: isAr ? "افتراضي الشركة" : "Company default" }
          ]}
        />
        <DataTable
          headers={isAr ? ["الفاتورة", "العميل", "الإجمالي", "المدفوع", "المستحق", "الحالة"] : ["Invoice", "Customer", "Total", "Paid", "Due", "Status"]}
          rows={debts.map(({ invoice, paid, due }) => [
            invoice.number,
            invoice.customer?.name ?? "-",
            formatMoney(Number(invoice.total), invoice.currencyCode),
            formatMoney(paid, invoice.currencyCode),
            formatMoney(due, invoice.currencyCode),
            <Badge key="status" variant={due === 0 ? "success" : "warning"}>{due === 0 ? (isAr ? "مسدد" : "Settled") : (isAr ? "مفتوح" : "Open")}</Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
