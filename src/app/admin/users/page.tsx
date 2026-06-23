import { Plus, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  changeUserPasswordAction,
  createPlatformUserAction,
  resendUserWelcomeEmailAction,
  resetUserPasswordAction,
  updateUserProfileAction,
  updateUserStatusAction
} from "@/app/admin/users/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["ACTIVE", "INVITED", "SUSPENDED", "DELETED"];

export default async function UsersPage() {
  const session = await requireSuperAdmin();
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { company: true, roles: { include: { role: true } } },
    take: 100
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Users" description="Create, edit, activate, suspend, delete, reset and resend account emails." icon={Users} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Platform User</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPlatformUserAction} className="grid gap-3 lg:grid-cols-6">
            <Input name="name" placeholder="Operations Admin" required />
            <Input name="email" type="email" placeholder="ops@kim-erb.com" required />
            <Input name="username" placeholder="ops.admin" required />
            <Input name="password" type="password" placeholder="Password" minLength={8} required />
            <Input name="confirmPassword" type="password" placeholder="Confirm password" minLength={8} required />
            <Button type="submit">
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3">Password</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{user.company?.name ?? "Platform"}</td>
                  <td className="px-5 py-4 text-slate-500">{user.roles.map((role) => role.role.name).join(", ") || "-"}</td>
                  <td className="px-5 py-4">
                    <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "danger" : "warning"}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <form action={updateUserProfileAction} className="grid min-w-[360px] gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <Input name="name" defaultValue={user.name} placeholder="Name" required />
                      <Input name="email" type="email" defaultValue={user.email} placeholder="Email" required />
                      <Input name="username" defaultValue={user.username} placeholder="Username" required />
                      <Button type="submit" size="sm" variant="outline">Save Profile</Button>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <form action={changeUserPasswordAction} className="grid min-w-[260px] gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <Input name="password" type="password" minLength={8} placeholder="New password" required />
                      <Input name="confirmPassword" type="password" minLength={8} placeholder="Confirm password" required />
                      <Button type="submit" size="sm" variant="outline">Change Password</Button>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <form action={updateUserStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <select name="status" defaultValue={user.status} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form action={resetUserPasswordAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button type="submit" size="sm" variant="outline">Reset Email</Button>
                      </form>
                      <form action={resendUserWelcomeEmailAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button type="submit" size="sm" variant="outline">Resend Welcome</Button>
                      </form>
                      {["ACTIVE", "SUSPENDED", "DELETED"].map((status) => (
                        <form key={status} action={updateUserStatusAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="status" value={status} />
                          <Button type="submit" size="sm" variant={status === "DELETED" ? "destructive" : "outline"}>
                            {status === "ACTIVE" ? "Activate" : status === "SUSPENDED" ? "Suspend" : "Delete"}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
