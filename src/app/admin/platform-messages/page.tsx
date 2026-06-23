import { Send } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sendPlatformMessageAction } from "@/app/admin/platform-messages/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlatformMessagesPage() {
  const session = await requireSuperAdmin();
  const [companies, users, messages] = await Promise.all([
    prisma.company.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    prisma.platformMessage.findMany({ include: { company: true }, orderBy: { createdAt: "desc" }, take: 100 })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Platform Messages" description="Send reminders and operational messages to companies, owners, or users." icon={Send} />
        <Card>
          <CardHeader>
            <CardTitle>Send message</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={sendPlatformMessageAction} className="grid gap-3 lg:grid-cols-4">
              <select name="audience" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="company">One company</option>
                <option value="companies">Multiple companies</option>
                <option value="all_companies">All companies</option>
                <option value="owners">Company owners only</option>
                <option value="user">One user</option>
              </select>
              <select name="companyIds" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <select name="userId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                ))}
              </select>
              <select name="priority" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
              <Input name="title" placeholder="Message title" required />
              <Input name="actionLink" placeholder="Optional action link" />
              <Input name="expiresAt" type="date" />
              <Input name="body" className="lg:col-span-4" placeholder="Message body" required />
              <Button type="submit" className="lg:col-span-4">
                <Send className="size-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Title", "Audience", "Company", "Priority", "Created"]}
          rows={messages.map((message) => [
            message.title,
            message.audience,
            message.company?.name ?? "Platform/User",
            <Badge key="priority" variant={message.priority === "urgent" ? "danger" : message.priority === "warning" ? "warning" : "secondary"}>
              {message.priority}
            </Badge>,
            message.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
