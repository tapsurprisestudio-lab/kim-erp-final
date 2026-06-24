import Link from "next/link";
import { LockKeyhole, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTenantRoleAction, updateTenantRolePermissionsAction } from "@/app/erp/employees/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const matrixModules = [
  "Dashboard",
  "Customers",
  "Sales",
  "Products",
  "Inventory",
  "Purchases",
  "Invoices",
  "Quotations",
  "Reports",
  "Payments",
  "Accounting",
  "Taxes",
  "Documents",
  "Settings",
  "Users",
  "Support"
];

const matrixActions = ["View", "Create", "Edit", "Delete", "Print", "PDF", "Approve"];

function matrixValue(module: string, action: string) {
  return `${module.toLowerCase()}.${action.toLowerCase()}`;
}

export default async function UsersPermissionsPage() {
  const { session, companyId } = await requireTenantPermission("employees.manage");
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { companyId, deletedAt: null },
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.role.findMany({
      where: { companyId },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Users & Permissions" description="Review company users, roles and permission coverage." icon={LockKeyhole}>
          <Button asChild>
            <Link href="/erp/employees">
              <Users className="size-4" />
              Manage Users
            </Link>
          </Button>
        </SectionHeader>
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-950">
            Company owners can invite users, assign roles, suspend users, reset passwords and review module permissions here. Direct page access is still checked server-side.
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <form action={createTenantRoleAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input name="name" placeholder="Role name, e.g. Accountant" required />
              <Input name="key" placeholder="Optional role key, e.g. accountant" />
              <Button type="submit">Create Role</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["User", "Email", "Roles", "Status"]}
          rows={users.map((user) => [
            user.name,
            user.email,
            user.roles.map((entry) => entry.role.name).join(", ") || "-",
            <Badge key="status" variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "secondary"}>
              {user.status}
            </Badge>
          ])}
        />
        <section className="space-y-4">
          {roles.map((role) => {
            const assigned = new Set(role.permissions.map((entry) => entry.permission.key));
            return (
              <Card key={role.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{role.name}</h3>
                      <p className="text-sm text-slate-500">{role._count.users} users</p>
                    </div>
                    <Badge variant={role.system ? "secondary" : "success"}>{role.system ? "System" : "Custom"}</Badge>
                  </div>
                  <form action={updateTenantRolePermissionsAction} className="overflow-x-auto">
                    <input type="hidden" name="roleId" value={role.id} />
                    <table className="w-full min-w-[920px] text-sm">
                      <thead className="text-xs uppercase text-slate-400">
                        <tr>
                          <th className="py-2 text-left">Module</th>
                          {matrixActions.map((action) => (
                            <th key={action} className="px-2 py-2 text-center">{action}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matrixModules.map((module) => (
                          <tr key={module}>
                            <td className="py-2 font-medium text-slate-700">{module}</td>
                            {matrixActions.map((action) => {
                              const value = matrixValue(module, action);
                              const assignedKeys = role.permissions.map((entry) => entry.permission.key);
                              const isChecked = assignedKeys.some((key) => value.startsWith(key.split(".")[0]));
                              return (
                                <td key={value} className="px-2 py-2 text-center">
                                  <input type="checkbox" name="permissions" value={value} defaultChecked={isChecked || assigned.has(value)} />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Button type="submit" className="mt-4">Save Permissions</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
