import { BarChart3, Building2, CreditCard, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getSafePlatformMetrics() {
  try {
    const [companies, users, subscriptions, payments] = await Promise.all([
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
      prisma.payment.count()
    ]);
    return { companies, users, subscriptions, payments };
  } catch (error) {
    console.error("[admin:index-load-failed]", error);
    return { companies: 0, users: 0, subscriptions: 0, payments: 0 };
  }
}

export default async function AdminIndexPage() {
  const session = await requireSuperAdmin();
  const metrics = await getSafePlatformMetrics();

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Platform Dashboard" description="Platform control center for companies, subscriptions, billing and users." icon={BarChart3} />
        <MetricGrid
          metrics={[
            { label: "Companies", value: metrics.companies.toLocaleString(), icon: Building2, detail: "Tenant registry" },
            { label: "Users", value: metrics.users.toLocaleString(), icon: Users, detail: "Platform and tenant accounts" },
            { label: "Subscriptions", value: metrics.subscriptions.toLocaleString(), icon: CreditCard, detail: "Active or trial" },
            { label: "Payments", value: metrics.payments.toLocaleString(), icon: BarChart3, detail: "Tenant payment records" }
          ]}
        />
      </div>
    </AppShell>
  );
}
