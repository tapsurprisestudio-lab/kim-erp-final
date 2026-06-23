import { Headphones } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateTicketStatusAction } from "@/app/admin/support/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];

export default async function SupportPage() {
  const session = await requireSuperAdmin();
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: true, assignee: true },
    take: 100
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Support Tickets" description="Track customer support across tenant companies." icon={Headphones} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Ticket</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800">{ticket.subject}</div>
                    <div className="max-w-lg truncate text-xs text-slate-500">{ticket.message}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{ticket.company?.name ?? "Platform"}</td>
                  <td className="px-5 py-4 text-slate-500">{ticket.priority}</td>
                  <td className="px-5 py-4">
                    <Badge variant={ticket.status === "CLOSED" ? "success" : "warning"}>{ticket.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{ticket.assignee?.name ?? "-"}</td>
                  <td className="px-5 py-4">
                    <form action={updateTicketStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={ticket.id} />
                      <select name="status" defaultValue={ticket.status} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
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
