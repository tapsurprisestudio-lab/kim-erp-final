import Link from "next/link";
import { Bell, LifeBuoy, ShieldAlert, Timer } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markAdminNotificationReadAction, markAllAdminNotificationsReadAction } from "@/app/admin/notifications/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotificationCenterPage() {
  const session = await requireSuperAdmin();
  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const [userNotifications, tickets, securityLogs, expiringSubscriptions] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 80
    }).catch((error) => {
      console.error("[admin-notifications:notifications-load-failed]", error);
      return [];
    }),
    prisma.supportTicket.findMany({ include: { company: true }, orderBy: { updatedAt: "desc" }, take: 40 }).catch((error) => {
      console.error("[admin-notifications:tickets-load-failed]", error);
      return [];
    }),
    prisma.securityLog.findMany({ include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 40 }).catch((error) => {
      console.error("[admin-notifications:security-load-failed]", error);
      return [];
    }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] }, endsAt: { lte: soon } },
      include: { company: true, plan: true },
      orderBy: { endsAt: "asc" },
      take: 40
    }).catch((error) => {
      console.error("[admin-notifications:subscriptions-load-failed]", error);
      return [];
    })
  ]);
  const signals = [
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
        <SectionHeader title="Notification Center" description="Prioritized platform signals from support, security and subscription events." icon={Bell}>
          <form action={markAllAdminNotificationsReadAction}>
            <Button type="submit" variant="outline">Mark all as read</Button>
          </form>
        </SectionHeader>
        <MetricGrid
          metrics={[
            { label: "Notifications", value: userNotifications.length.toLocaleString(), icon: Bell, detail: "Targeted to you" },
            { label: "Support Signals", value: tickets.length.toLocaleString(), icon: LifeBuoy, detail: "Recent tickets" },
            { label: "Security Signals", value: securityLogs.length.toLocaleString(), icon: ShieldAlert, detail: "Recent security logs" },
            { label: "Expiring Plans", value: expiringSubscriptions.length.toLocaleString(), icon: Timer, detail: "Next 14 days" }
          ]}
        />
        <DataTable
          headers={["Title", "Message", "Priority", "Status", "Date", "Action"]}
          rows={userNotifications.map((notification) => [
            notification.title,
            notification.body,
            <Badge key="priority" variant={notification.priority === "urgent" ? "danger" : notification.priority === "warning" ? "warning" : "secondary"}>
              {notification.priority}
            </Badge>,
            notification.readAt ? "Read" : "Unread",
            notification.createdAt.toLocaleString(),
            <div key="actions" className="flex flex-wrap gap-2">
              {notification.actionLink && (
                <Button asChild size="sm" variant="outline">
                  <Link href={notification.actionLink}>Open</Link>
                </Button>
              )}
              {!notification.readAt && (
                <form action={markAdminNotificationReadAction}>
                  <input type="hidden" name="id" value={notification.id} />
                  <Button type="submit" size="sm" variant="outline">Mark read</Button>
                </form>
              )}
            </div>
          ])}
        />
        <DataTable
          headers={["Type", "Message", "Source", "Severity", "Date"]}
          rows={signals.map((notification) => [
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
