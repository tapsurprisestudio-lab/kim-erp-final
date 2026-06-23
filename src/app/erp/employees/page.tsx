import { UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inviteEmployeeAction, resetEmployeePasswordAction, updateEmployeeStatusAction } from "@/app/erp/employees/actions";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { session, companyId } = await requireTenant();
  const [users, roles, activeUsers, invitedUsers] = await Promise.all([
    prisma.user.findMany({ where: { companyId, deletedAt: null }, include: { roles: { include: { role: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.role.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.user.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { companyId, deletedAt: null, status: "INVITED" } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Employees" description="Tenant users, invitations and account lifecycle controls." icon={Users} />
        <MetricGrid
          metrics={[
            { label: "Employees", value: users.length.toLocaleString(), icon: Users, detail: "Tenant accounts" },
            { label: "Active", value: activeUsers.toLocaleString(), icon: Users, detail: "Can sign in" },
            { label: "Invited", value: invitedUsers.toLocaleString(), icon: UserPlus, detail: "Activation pending" },
            { label: "Roles", value: roles.length.toLocaleString(), icon: Users, detail: "Tenant role assignments" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Invite employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteEmployeeAction} className="grid gap-3 md:grid-cols-4">
              <Input name="name" placeholder="Full name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <select name="roleId" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" required>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Button type="submit">
                <UserPlus className="size-4" />
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Name", "Email", "Roles", "Status", "Actions"]}
          rows={users.map((user) => [
            user.name,
            user.email,
            user.roles.map((entry) => entry.role.name).join(", ") || "-",
            <Badge key="status" variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "secondary"}>
              {user.status}
            </Badge>,
            <div key="actions" className="flex flex-wrap gap-2">
              {["ACTIVE", "SUSPENDED"].map((status) => (
                <form key={status} action={updateEmployeeStatusAction}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="status" value={status} />
                  <Button type="submit" size="sm" variant="outline">{status === "ACTIVE" ? "Activate" : "Suspend"}</Button>
                </form>
              ))}
              <form action={resetEmployeePasswordAction}>
                <input type="hidden" name="id" value={user.id} />
                <Button type="submit" size="sm" variant="outline">Reset</Button>
              </form>
              <form action={updateEmployeeStatusAction}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="status" value="DELETED" />
                <Button type="submit" size="sm" variant="outline">Delete</Button>
              </form>
            </div>
          ])}
        />
      </div>
    </AppShell>
  );
}
