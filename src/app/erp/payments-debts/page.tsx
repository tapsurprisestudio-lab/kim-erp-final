import { WalletCards } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsDebtsPage() {
  const { session, companyId } = await requireTenant();
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

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Payments & Debts" description="Customer payment collection and outstanding balances." icon={WalletCards} />
        <MetricGrid
          metrics={[
            { label: "Collected", value: formatMoney(Number(payments._sum.amount ?? 0), company.defaultCurrency), icon: WalletCards, detail: `${payments._count} payments` },
            { label: "Outstanding", value: formatMoney(totalDue, company.defaultCurrency), icon: WalletCards, detail: "Unpaid invoice balance" },
            { label: "Invoices", value: invoices.length.toLocaleString(), icon: WalletCards, detail: "Tracked documents" },
            { label: "Currency", value: company.defaultCurrency, icon: WalletCards, detail: "Company default" }
          ]}
        />
        <DataTable
          headers={["Invoice", "Customer", "Total", "Paid", "Due", "Status"]}
          rows={debts.map(({ invoice, paid, due }) => [
            invoice.number,
            invoice.customer?.name ?? "-",
            formatMoney(Number(invoice.total), invoice.currencyCode),
            formatMoney(paid, invoice.currencyCode),
            formatMoney(due, invoice.currencyCode),
            <Badge key="status" variant={due === 0 ? "success" : "warning"}>{due === 0 ? "Settled" : "Open"}</Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
