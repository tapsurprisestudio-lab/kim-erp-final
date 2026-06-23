import { BriefcaseBusiness, ShieldCheck, UserCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function HrPage() {
  const { session, companyId } = await requireTenant();
  const [users, roles, activeUsers, suspendedUsers] = await Promise.all([
    prisma.user.findMany({ where: { companyId, deletedAt: null }, include: { roles: { include: { role: true } } }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { companyId }, include: { _count: { select: { users: true, permissions: true } } }, orderBy: { name: "asc" } }),
    prisma.user.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { companyId, deletedAt: null, status: "SUSPENDED" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="HR" description="Workforce roster and role coverage for this tenant." icon={BriefcaseBusiness} />
        <MetricGrid
          metrics={[
            { label: "Employees", value: users.length.toLocaleString(), icon: Users, detail: "Tenant workforce" },
            { label: "Active", value: activeUsers.toLocaleString(), icon: UserCheck, detail: "Enabled accounts" },
            { label: "Suspended", value: suspendedUsers.toLocaleString(), icon: ShieldCheck, detail: "Restricted accounts" },
            { label: "Roles", value: roles.length.toLocaleString(), icon: BriefcaseBusiness, detail: "Permission groups" }
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <DataTable
            headers={["Employee", "Email", "Roles", "Status"]}
            rows={users.map((user) => [
              user.name,
              user.email,
              user.roles.map((entry) => entry.role.name).join(", ") || "-",
              <Badge key="status" variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "secondary"}>
                {user.status}
              </Badge>
            ])}
          />
          <DataTable
            headers={["Role", "Users", "Permissions"]}
            rows={roles.map((role) => [role.name, role._count.users.toLocaleString(), role._count.permissions.toLocaleString()])}
          />
        </div>
      </div>
    </AppShell>
  );
}
