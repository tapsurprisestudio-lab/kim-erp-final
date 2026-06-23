import { BadgeDollarSign } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const { session, companyId } = await requireTenant();
  const [company, invoices] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null }, include: { customer: true }, orderBy: { issueDate: "desc" }, take: 100 })
  ]);
  const taxTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.taxTotal), 0);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Taxes" description="Invoice tax totals and fiscal document tracking." icon={BadgeDollarSign} />
        <MetricGrid metrics={[
          { label: "Tax Total", value: formatMoney(taxTotal, company.defaultCurrency), icon: BadgeDollarSign, detail: "From sales invoices" },
          { label: "Invoices", value: invoices.length.toLocaleString(), icon: BadgeDollarSign, detail: "Taxable documents" },
          { label: "Tax Number", value: company.taxNumber ?? "-", icon: BadgeDollarSign, detail: "Company fiscal ID" },
          { label: "Currency", value: company.defaultCurrency, icon: BadgeDollarSign, detail: "Tax reporting currency" }
        ]} />
        <DataTable
          headers={["Invoice", "Customer", "Subtotal", "Tax", "Total"]}
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
