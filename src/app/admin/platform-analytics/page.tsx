import { BarChart3, Building2, FileText, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlatformAnalyticsPage() {
  const session = await requireSuperAdmin();
  const [companies, users, invoices, supportTickets, topCompanies] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.invoice.count({ where: { deletedAt: null } }),
    prisma.supportTicket.count(),
    prisma.company.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { users: true, products: true, invoices: true, stockMovements: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Platform Analytics" description="Adoption and operating metrics across all tenants." icon={BarChart3} />
        <MetricGrid
          metrics={[
            { label: "Companies", value: companies.toLocaleString(), icon: Building2, detail: "Tenant workspaces" },
            { label: "Users", value: users.toLocaleString(), icon: Users, detail: "Platform and tenant accounts" },
            { label: "Invoices", value: invoices.toLocaleString(), icon: FileText, detail: "Tenant documents" },
            { label: "Support Tickets", value: supportTickets.toLocaleString(), icon: BarChart3, detail: "Lifecycle interactions" }
          ]}
        />
        <DataTable
          headers={["Company", "Users", "Products", "Invoices", "Stock Movements", "Status"]}
          rows={topCompanies.map((company) => [
            company.name,
            company._count.users.toLocaleString(),
            company._count.products.toLocaleString(),
            company._count.invoices.toLocaleString(),
            company._count.stockMovements.toLocaleString(),
            <Badge key="status" variant={company.status === "ACTIVE" ? "success" : "secondary"}>
              {company.status}
            </Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
