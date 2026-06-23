import { Activity, Building2, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GrowthMetricsPage() {
  const session = await requireSuperAdmin();
  const since30 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const [newCompanies, newUsers, newSubscriptions, activity, companies] = await Promise.all([
    prisma.company.count({ where: { createdAt: { gte: since30 }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: since30 }, deletedAt: null } }),
    prisma.subscription.count({ where: { createdAt: { gte: since30 } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: since30 } } }),
    prisma.company.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { users: true, invoices: true, products: true } } },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Growth Metrics" description="Recent 30-day acquisition, activation and usage movement." icon={TrendingUp} />
        <MetricGrid
          metrics={[
            { label: "New Companies", value: newCompanies.toLocaleString(), icon: Building2, detail: "Last 30 days" },
            { label: "New Users", value: newUsers.toLocaleString(), icon: Users, detail: "Last 30 days" },
            { label: "Subscriptions", value: newSubscriptions.toLocaleString(), icon: TrendingUp, detail: "Created in window" },
            { label: "Activity", value: activity.toLocaleString(), icon: Activity, detail: "Audit events in window" }
          ]}
        />
        <DataTable
          headers={["Company", "Created", "Users", "Products", "Invoices"]}
          rows={companies.map((company) => [
            company.name,
            company.createdAt.toLocaleDateString(),
            company._count.users.toLocaleString(),
            company._count.products.toLocaleString(),
            company._count.invoices.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
