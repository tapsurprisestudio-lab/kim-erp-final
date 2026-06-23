import { Building2, CreditCard, Package, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const session = await requireSuperAdmin();
  const [tenants, totalUsers, totalProducts, activeSubscriptions] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        owner: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { users: true, products: true, invoices: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.user.count({ where: { companyId: { not: null }, deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Tenants" description="Company workspaces isolated from platform operations." icon={Building2} />
        <MetricGrid
          metrics={[
            { label: "Tenant Companies", value: tenants.length.toLocaleString(), icon: Building2, detail: "Active registry entries" },
            { label: "Tenant Users", value: totalUsers.toLocaleString(), icon: Users, detail: "Non-platform accounts" },
            { label: "Tenant Products", value: totalProducts.toLocaleString(), icon: Package, detail: "Across all companies" },
            { label: "Live Subscriptions", value: activeSubscriptions.toLocaleString(), icon: CreditCard, detail: "Trial and active plans" }
          ]}
        />
        <DataTable
          headers={["Tenant", "Owner", "Plan", "Users", "ERP Records", "Status"]}
          rows={tenants.map((tenant) => {
            const subscription = tenant.subscriptions[0];
            return [
              <div key="tenant">
                <p className="font-semibold text-slate-950">{tenant.name}</p>
                <p className="text-xs text-slate-500">{tenant.slug}</p>
              </div>,
              tenant.owner?.email ?? "No owner",
              subscription?.plan.name ?? "No plan",
              tenant._count.users.toLocaleString(),
              `${tenant._count.products.toLocaleString()} products / ${tenant._count.invoices.toLocaleString()} invoices`,
              <Badge key="status" variant={tenant.status === "ACTIVE" ? "success" : "secondary"}>
                {tenant.status}
              </Badge>
            ];
          })}
        />
      </div>
    </AppShell>
  );
}
