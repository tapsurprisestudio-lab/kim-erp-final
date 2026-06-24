import { Headphones } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { replyToTicketAction, updateTicketStatusAction } from "@/app/admin/support/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];

export default async function SupportPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; priority?: string; companyId?: string }>;
}) {
  const session = await requireSuperAdmin();
  const query = await searchParams;
  const where = {
    ...(query.status ? { status: query.status as "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED" } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.companyId ? { companyId: query.companyId } : {})
  };
  const companies = await prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { company: true, assignee: true, replies: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 2 } },
    take: 100
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Support Tickets" description="Track customer support across tenant companies." icon={Headphones} />
      <Card className="mb-5 border-blue-100 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-950">
          Review tenant tickets, filter by company/status/priority, reply to the tenant, and update ticket status. Replies notify the company automatically.
        </CardContent>
      </Card>
      <Card className="mb-5">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-4">
            <select name="companyId" defaultValue={query.companyId ?? ""} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={query.status ?? ""} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select name="priority" defaultValue={query.priority ?? ""} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">All priorities</option>
              {["low", "normal", "high", "urgent"].map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            <Button type="submit" variant="outline">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>
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
                <th className="px-5 py-3">Latest Reply</th>
                <th className="px-5 py-3">Update</th>
                <th className="px-5 py-3">Reply</th>
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
                  <td className="px-5 py-4 text-slate-500">
                    {ticket.replies[0] ? (
                      <div>
                        <div className="max-w-xs truncate">{ticket.replies[0].message}</div>
                        <div className="text-xs text-slate-400">{ticket.replies[0].user?.name ?? "Platform"} - {ticket.replies[0].createdAt.toLocaleString()}</div>
                      </div>
                    ) : "-"}
                  </td>
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
                  <td className="px-5 py-4">
                    <form action={replyToTicketAction} className="flex min-w-[280px] gap-2">
                      <input type="hidden" name="id" value={ticket.id} />
                      <Input name="message" placeholder="Reply to tenant" required />
                      <Button type="submit" size="sm" variant="outline">Reply</Button>
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
