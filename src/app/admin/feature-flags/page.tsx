import { Flag, Layers3, PackageCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function featureList(features: unknown) {
  if (Array.isArray(features)) {
    return features.map(String);
  }
  if (features && typeof features === "object") {
    return Object.entries(features as Record<string, unknown>)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
  }
  return [];
}

export default async function FeatureFlagsPage() {
  const session = await requireSuperAdmin();
  const [plans, companies, users] = await Promise.all([
    prisma.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { monthlyPrice: "asc" } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } })
  ]);
  const enabledFlags = new Set(plans.flatMap((plan) => featureList(plan.features)));

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Feature Flags" description="Plan-level capabilities controlling tenant ERP access." icon={Flag} />
        <MetricGrid
          metrics={[
            { label: "Feature Flags", value: enabledFlags.size.toLocaleString(), icon: Flag, detail: "Unique enabled capabilities" },
            { label: "Plans", value: plans.length.toLocaleString(), icon: Layers3, detail: "Subscription tiers" },
            { label: "Tenants", value: companies.toLocaleString(), icon: PackageCheck, detail: "Feature consumers" },
            { label: "Users", value: users.toLocaleString(), icon: Users, detail: "Potential audience" }
          ]}
        />
        <DataTable
          headers={["Plan", "Subscriptions", "Flags", "Status"]}
          rows={plans.map((plan) => [
            plan.name,
            plan._count.subscriptions.toLocaleString(),
            featureList(plan.features).join(", ") || "Base access",
            <Badge key="status" variant={plan.active ? "success" : "secondary"}>
              {plan.active ? "ACTIVE" : "DISABLED"}
            </Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
