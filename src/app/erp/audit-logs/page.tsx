import { Activity } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantAuditLogsPage() {
  const { session, companyId } = await requireTenant();
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 150
  });

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Audit Logs" description="Company-scoped audit trail for tenant actions." icon={Activity} />
        <DataTable
          headers={["Action", "Entity", "Actor", "Date"]}
          rows={logs.map((log) => [
            log.action,
            `${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`,
            log.user?.email ?? "System",
            log.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
