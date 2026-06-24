import Link from "next/link";
import { LockKeyhole, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

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
        <DataTable
          headers={["Role", "Users", "Permissions"]}
          rows={roles.map((role) => [
            role.name,
            role._count.users.toLocaleString(),
            <div key="permissions" className="flex max-w-4xl flex-wrap gap-2">
              {role.permissions.map((entry) => (
                <Badge key={entry.permissionId} variant="secondary">
                  {entry.permission.key}
                </Badge>
              ))}
            </div>
          ])}
        />
      </div>
    </AppShell>
  );
}
