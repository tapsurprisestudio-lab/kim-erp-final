import { LockKeyhole, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPlatformRoleAction } from "@/app/admin/roles/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const session = await requireSuperAdmin();
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ scope: "asc" }, { name: "asc" }],
      include: { company: true, permissions: { include: { permission: true } }, _count: { select: { users: true } } }
    }),
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] })
  ]);

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Roles & Permissions" description="Create platform roles and inspect tenant RBAC." icon={LockKeyhole} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Platform Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPlatformRoleAction} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="name" placeholder="Support Manager" required />
              <Input name="description" placeholder="Can manage support and logs" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-600">
                  <input type="checkbox" name="permissions" value={permission.key} />
                  {permission.key}
                </label>
              ))}
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              Save Role
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex justify-between gap-3">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{role.company?.name ?? "Platform"}</p>
                </div>
                {role.system && <Badge>System</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-sm text-slate-500">Users: {role._count.users}</div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 8).map((permission) => (
                  <Badge key={permission.permissionId} variant="secondary">
                    {permission.permission.key}
                  </Badge>
                ))}
                {role.permissions.length > 8 && <Badge variant="secondary">+{role.permissions.length - 8}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
