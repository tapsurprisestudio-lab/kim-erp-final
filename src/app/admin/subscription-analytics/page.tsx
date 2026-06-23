import { CalendarClock, CreditCard, Layers3, TimerReset } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubscriptionAnalyticsPage() {
  const session = await requireSuperAdmin();
  const expiringDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const [subscriptions, activeCount, trialCount, expiringCount, plans] = await Promise.all([
    prisma.subscription.findMany({ include: { company: true, plan: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] }, endsAt: { lte: expiringDate } } }),
    prisma.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { monthlyPrice: "asc" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Subscription Analytics" description="Plan adoption, trial health and renewal exposure." icon={CreditCard} />
        <MetricGrid
          metrics={[
            { label: "Active", value: activeCount.toLocaleString(), icon: CreditCard, detail: "Paid subscriptions" },
            { label: "Trials", value: trialCount.toLocaleString(), icon: TimerReset, detail: "Trial subscriptions" },
            { label: "Expiring Soon", value: expiringCount.toLocaleString(), icon: CalendarClock, detail: "Next 14 days" },
            { label: "Plans", value: plans.length.toLocaleString(), icon: Layers3, detail: "Available tiers" }
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <DataTable
            headers={["Company", "Plan", "Price", "Status", "Ends"]}
            rows={subscriptions.map((subscription) => [
              subscription.company.name,
              subscription.plan.name,
              formatMoney(Number(subscription.plan.monthlyPrice), subscription.plan.currencyCode),
              <Badge key="status" variant={subscription.status === "ACTIVE" ? "success" : "secondary"}>
                {subscription.status}
              </Badge>,
              subscription.endsAt.toLocaleDateString()
            ])}
          />
          <DataTable
            headers={["Plan", "Subscriptions"]}
            rows={plans.map((plan) => [plan.name, plan._count.subscriptions.toLocaleString()])}
          />
        </div>
      </div>
    </AppShell>
  );
}
