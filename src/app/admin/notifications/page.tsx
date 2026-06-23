import { Bell, LifeBuoy, ShieldAlert, Timer } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotificationCenterPage() {
  const session = await requireSuperAdmin();
  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const [tickets, securityLogs, expiringSubscriptions] = await Promise.all([
    prisma.supportTicket.findMany({ include: { company: true }, orderBy: { updatedAt: "desc" }, take: 40 }),
    prisma.securityLog.findMany({ include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] }, endsAt: { lte: soon } },
      include: { company: true, plan: true },
      orderBy: { endsAt: "asc" },
      take: 40
    })
  ]);
  const notifications = [
    ...tickets.map((ticket) => ({
      type: "Support",
      message: ticket.subject,
      source: ticket.company?.name ?? "Platform",
      severity: ticket.priority,
      date: ticket.updatedAt
    })),
    ...securityLogs.map((log) => ({
      type: "Security",
      message: log.message,
      source: log.company?.name ?? log.user?.email ?? "Platform",
      severity: log.type.includes("FAILED") ? "high" : "normal",
      date: log.createdAt
    })),
    ...expiringSubscriptions.map((subscription) => ({
      type: "Subscription",
      message: `${subscription.plan.name} expires soon`,
      source: subscription.company.name,
      severity: "normal",
      date: subscription.endsAt
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 100);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Notification Center" description="Prioritized platform signals from support, security and subscription events." icon={Bell} />
        <MetricGrid
          metrics={[
            { label: "Notifications", value: notifications.length.toLocaleString(), icon: Bell, detail: "Current queue" },
            { label: "Support Signals", value: tickets.length.toLocaleString(), icon: LifeBuoy, detail: "Recent tickets" },
            { label: "Security Signals", value: securityLogs.length.toLocaleString(), icon: ShieldAlert, detail: "Recent security logs" },
            { label: "Expiring Plans", value: expiringSubscriptions.length.toLocaleString(), icon: Timer, detail: "Next 14 days" }
          ]}
        />
        <DataTable
          headers={["Type", "Message", "Source", "Severity", "Date"]}
          rows={notifications.map((notification) => [
            notification.type,
            notification.message,
            notification.source,
            <Badge key="severity" variant={notification.severity === "high" ? "danger" : "secondary"}>
              {notification.severity}
            </Badge>,
            notification.date.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
