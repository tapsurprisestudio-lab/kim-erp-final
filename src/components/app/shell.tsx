import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import { auth } from "@/auth";
import { directionForLocale, normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

async function getShellCompany(companyId?: string | null) {
  if (!companyId) {
    return null;
  }
  try {
    return await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        logoUrl: true,
        defaultLanguage: true,
        defaultCurrency: true
      }
    });
  } catch (error) {
    console.error("[app-shell:company-load-failed]", { companyId, error });
    return null;
  }
}

async function getUnreadNotificationCount(userId?: string, companyId?: string | null) {
  if (!userId) {
    return 0;
  }
  try {
    return await prisma.notification.count({
      where: {
        readAt: null,
        OR: [
          { userId },
          ...(companyId ? [{ companyId }] : [])
        ]
      }
    });
  } catch (error) {
    console.error("[app-shell:notifications-count-failed]", { userId, companyId, error });
    return 0;
  }
}

export async function AppShell({
  children,
  userName,
  scope = "platform"
}: {
  children: React.ReactNode;
  userName?: string | null;
  scope?: "platform" | "tenant";
}) {
  const session = await auth();
  const company = scope === "tenant" ? await getShellCompany(session?.user?.companyId) : null;
  const locale = normalizeLocale(company?.defaultLanguage ?? session?.user?.locale);
  const unreadCount = await getUnreadNotificationCount(session?.user?.id, session?.user?.companyId);

  return (
    <div className="app-shell min-h-screen" dir={directionForLocale(locale)} data-theme="light">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-white/60 shadow-soft lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-2xl lg:border lg:border-white">
        <Sidebar scope={scope} locale={locale} companyName={company?.name} companyLogoUrl={company?.logoUrl} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            userName={userName}
            scope={scope}
            locale={locale}
            unreadCount={unreadCount}
            companyName={company?.name}
            companyLogoUrl={company?.logoUrl}
          />
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6">{children}</main>
        </div>
      </div>
      <MobileNav scope={scope} locale={locale} />
    </div>
  );
}
