import { BadgeDollarSign, Building2, CreditCard, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await requireSuperAdmin();
  const [payments, aggregate, companies, invoices] = await Promise.all([
    prisma.payment.findMany({
      include: { company: true, invoice: true },
      orderBy: { paidAt: "desc" },
      take: 100
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.invoice.count({ where: { deletedAt: null } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Payments" description="Platform view of tenant payment activity." icon={CreditCard} />
        <MetricGrid
          metrics={[
            { label: "Payments", value: aggregate._count.toLocaleString(), icon: CreditCard, detail: "Recorded tenant receipts" },
            { label: "Collected", value: formatMoney(Number(aggregate._sum.amount ?? 0), "LYD"), icon: BadgeDollarSign, detail: "Across currencies normalized for display" },
            { label: "Companies", value: companies.toLocaleString(), icon: Building2, detail: "Payment-enabled tenants" },
            { label: "Invoices", value: invoices.toLocaleString(), icon: ReceiptText, detail: "Billable tenant documents" }
          ]}
        />
        <DataTable
          headers={["Company", "Invoice", "Amount", "Method", "Reference", "Paid At"]}
          rows={payments.map((payment) => [
            payment.company.name,
            payment.invoice?.number ?? "Direct payment",
            formatMoney(Number(payment.amount), payment.currencyCode),
            payment.method,
            payment.reference ?? "-",
            payment.paidAt.toLocaleDateString()
          ])}
        />
      </div>
    </AppShell>
  );
}
