import { Activity, AlertTriangle, Database, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const session = await requireSuperAdmin();
  const [failedLogins, openTickets, auditEvents, securityEvents, recentSecurity] = await Promise.all([
    prisma.loginAttempt.count({ where: { success: false } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
    prisma.auditLog.count(),
    prisma.securityLog.count(),
    prisma.securityLog.findMany({ include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 50 })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Monitoring" description="Live health signals from authentication, support and audit streams." icon={Activity} />
        <MetricGrid
          metrics={[
            { label: "Failed Logins", value: failedLogins.toLocaleString(), icon: AlertTriangle, detail: "All recorded attempts" },
            { label: "Open Tickets", value: openTickets.toLocaleString(), icon: LifeBuoy, detail: "Support queue" },
            { label: "Audit Events", value: auditEvents.toLocaleString(), icon: Database, detail: "Business history" },
            { label: "Security Events", value: securityEvents.toLocaleString(), icon: Activity, detail: "Risk history" }
          ]}
        />
        <DataTable
          headers={["Event", "Message", "Scope", "Actor", "Date"]}
          rows={recentSecurity.map((event) => [
            <Badge key="event" variant={event.type === "LOGIN_FAILED" ? "danger" : "secondary"}>{event.type}</Badge>,
            event.message,
            event.company?.name ?? "Platform",
            event.user?.email ?? "Anonymous",
            event.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
