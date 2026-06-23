import { UserRound } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function SalesRepresentativesPage() {
  const { session, companyId } = await requireTenant();
  const users = await prisma.user.findMany({
    where: { companyId, deletedAt: null, roles: { some: { role: { name: { contains: "sales", mode: "insensitive" } } } } },
    include: { roles: { include: { role: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Sales Representatives" description="Tenant users assigned to sales roles." icon={UserRound} />
        <MetricGrid metrics={[
          { label: "Representatives", value: users.length.toLocaleString(), icon: UserRound, detail: "Sales-role users" },
          { label: "Active", value: users.filter((user) => user.status === "ACTIVE").length.toLocaleString(), icon: UserRound, detail: "Can sign in" },
          { label: "Suspended", value: users.filter((user) => user.status === "SUSPENDED").length.toLocaleString(), icon: UserRound, detail: "Restricted" },
          { label: "Invited", value: users.filter((user) => user.status === "INVITED").length.toLocaleString(), icon: UserRound, detail: "Pending" }
        ]} />
        <DataTable
          headers={["Name", "Email", "Roles", "Status"]}
          rows={users.map((user) => [
            user.name,
            user.email,
            user.roles.map((entry) => entry.role.name).join(", "),
            <Badge key="status" variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "secondary"}>{user.status}</Badge>
          ])}
        />
      </div>
    </AppShell>
  );
}
