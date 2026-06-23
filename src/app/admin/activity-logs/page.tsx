import { Activity, Building2, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActivityLogsPage() {
  const session = await requireSuperAdmin();
  const [logs, auditCount, securityCount, actorCount, companyCount] = await Promise.all([
    prisma.auditLog.findMany({ include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 150 }),
    prisma.auditLog.count(),
    prisma.securityLog.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: null } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Activity Logs" description="Operational changes recorded across platform and tenants." icon={Activity} />
        <MetricGrid
          metrics={[
            { label: "Audit Events", value: auditCount.toLocaleString(), icon: Activity, detail: "Business actions" },
            { label: "Security Events", value: securityCount.toLocaleString(), icon: ShieldCheck, detail: "Auth and risk events" },
            { label: "Actors", value: actorCount.toLocaleString(), icon: Users, detail: "Registered users" },
            { label: "Companies", value: companyCount.toLocaleString(), icon: Building2, detail: "Tenant scope coverage" }
          ]}
        />
        <DataTable
          headers={["Action", "Entity", "Actor", "Company", "Date"]}
          rows={logs.map((log) => [
            log.action,
            `${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`,
            log.user?.email ?? "System",
            log.company?.name ?? "Platform",
            log.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
