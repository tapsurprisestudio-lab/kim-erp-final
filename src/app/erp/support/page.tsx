import { Headphones, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTenantSupportTicketAction } from "@/app/erp/support/actions";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantSupportPage() {
  const { session, companyId } = await requireTenant();
  const tickets = await prisma.supportTicket.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Help / Support" description="Create and track support tickets for this company." icon={Headphones} />
        <Card>
          <CardHeader>
            <CardTitle>Create ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTenantSupportTicketAction} className="grid gap-3 lg:grid-cols-4">
              <Input name="subject" placeholder="Subject" required />
              <select name="priority" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Input name="message" className="lg:col-span-2" placeholder="Message" required />
              <Button type="submit" className="lg:col-span-4">
                <Plus className="size-4" />
                Create Ticket
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Subject", "Priority", "Status", "Created"]}
          rows={tickets.map((ticket) => [
            ticket.subject,
            ticket.priority,
            <Badge key="status" variant={ticket.status === "OPEN" ? "warning" : ticket.status === "RESOLVED" ? "success" : "secondary"}>{ticket.status}</Badge>,
            ticket.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
