import { Headphones, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTenantSupportTicketAction } from "@/app/erp/support/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantSupportPage() {
  const { session, companyId } = await requireTenantPermission("company.dashboard.read");
  const [company, tickets] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.supportTicket.findMany({
    where: { companyId },
    include: { replies: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100
    })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "المساعدة والدعم" : "Help / Support"} description={isAr ? "أنشئ وتابع تذاكر الدعم الخاصة بالشركة." : "Create and track support tickets for this company."} icon={Headphones} />
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-950">
            {isAr ? "تحتاج مساعدة؟ أنشئ تذكرة بعنوان واضح وأولوية مناسبة. سيرد دعم KIM-ERB هنا وستصلك إشعار عند التحديث." : "Need help? Create a ticket with a clear subject and priority. KIM-ERB support replies here, and you will receive a notification when the ticket is updated."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "إنشاء تذكرة" : "Create ticket"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTenantSupportTicketAction} className="grid gap-3 lg:grid-cols-4">
              <Input name="subject" placeholder={isAr ? "الموضوع" : "Subject"} required />
              <select name="priority" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="normal">{isAr ? "عادي" : "Normal"}</option>
                <option value="low">{isAr ? "منخفض" : "Low"}</option>
                <option value="high">{isAr ? "مرتفع" : "High"}</option>
                <option value="urgent">{isAr ? "عاجل" : "Urgent"}</option>
              </select>
              <Input name="message" className="lg:col-span-2" placeholder={isAr ? "الرسالة" : "Message"} required />
              <Button type="submit" className="lg:col-span-4">
                <Plus className="size-4" />
                {isAr ? "إنشاء التذكرة" : "Create Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={isAr ? ["الموضوع", "الأولوية", "الحالة", "آخر رد", "تاريخ الإنشاء"] : ["Subject", "Priority", "Status", "Latest Reply", "Created"]}
          rows={tickets.map((ticket) => [
            ticket.subject,
            ticket.priority,
            <Badge key="status" variant={ticket.status === "OPEN" ? "warning" : ticket.status === "RESOLVED" ? "success" : "secondary"}>{ticket.status}</Badge>,
            ticket.replies[0]?.message ?? "-",
            ticket.createdAt.toLocaleString()
          ])}
        />
      </div>
    </AppShell>
  );
}
