import { Activity } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const session = await requireSuperAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, company: true },
    take: 150
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Audit Logs" description="Immutable operational actions across platform and tenants." icon={Activity} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{log.action}</td>
                  <td className="px-5 py-4 text-slate-500">{log.entity}</td>
                  <td className="px-5 py-4 text-slate-500">{log.company?.name ?? "Platform"}</td>
                  <td className="px-5 py-4 text-slate-500">{log.user?.name ?? "System"}</td>
                  <td className="px-5 py-4 text-slate-500">{log.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
