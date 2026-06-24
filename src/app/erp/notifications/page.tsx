import Link from "next/link";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markAllTenantNotificationsReadAction, markNotificationReadAction } from "@/app/erp/notifications/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantNotificationsPage() {
  const { session, companyId } = await requireTenantPermission("notifications.read");
  const [company, notifications] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    (async () => {
    try {
      return await prisma.notification.findMany({
        where: {
          AND: [
            { OR: [{ userId: session.user.id }, { companyId }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });
    } catch (error) {
      console.error("[tenant-notifications:load-failed]", { companyId, userId: session.user.id, error });
      return [];
    }
  })()
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "الإشعارات" : "Notifications"} description={isAr ? "رسائل الشركة والتنبيهات وتحديثات الدعم والحساب." : "Company messages, reminders, account status and ERP alerts."} icon={Bell}>
          <form action={markAllTenantNotificationsReadAction}>
            <Button type="submit" variant="outline">{isAr ? "تعليم الكل كمقروء" : "Mark all as read"}</Button>
          </form>
        </SectionHeader>
        <DataTable
          headers={isAr ? ["العنوان", "الأولوية", "الحالة", "التاريخ", "الإجراء"] : ["Title", "Priority", "Status", "Date", "Action"]}
          rows={notifications.map((notification) => [
            <div key="title">
              <p className="font-semibold text-slate-950">{notification.title}</p>
              <p className="text-xs text-slate-500">{notification.body}</p>
            </div>,
            <Badge key="priority" variant={notification.priority === "urgent" ? "danger" : notification.priority === "warning" ? "warning" : "secondary"}>
              {notification.priority}
            </Badge>,
            notification.readAt ? (isAr ? "مقروء" : "Read") : (isAr ? "غير مقروء" : "Unread"),
            notification.createdAt.toLocaleString(),
            <div key="actions" className="flex flex-wrap gap-2">
              {notification.actionLink && (
                <Button asChild size="sm" variant="outline">
                  <Link href={notification.actionLink}>{isAr ? "فتح" : "Open"}</Link>
                </Button>
              )}
              {!notification.readAt && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={notification.id} />
                  <Button type="submit" size="sm" variant="outline">{isAr ? "تعليم كمقروء" : "Mark read"}</Button>
                </form>
              )}
            </div>
          ])}
        />
      </div>
    </AppShell>
  );
}
