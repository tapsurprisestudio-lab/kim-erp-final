import { Bell, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function Topbar({
  userName = "User",
  scope = "platform",
  locale = "en",
  unreadCount = 0,
  companyLogoUrl,
  companyName
}: {
  userName?: string | null;
  scope?: "platform" | "tenant";
  locale?: Locale;
  unreadCount?: number;
  companyLogoUrl?: string | null;
  companyName?: string | null;
}) {
  const notificationsHref = scope === "tenant" ? "/erp/notifications" : "/admin/notifications";
  const settingsHref = scope === "tenant" ? "/erp/settings" : "/admin/settings";
  const initials = (userName ?? "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-100 bg-white/85 px-4 py-2 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        {scope === "tenant" && companyLogoUrl ? (
          <div className="size-9 rounded-xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${companyLogoUrl})` }} aria-label={companyName ?? "Company logo"} />
        ) : (
          <Logo compact />
        )}
        <span className="max-w-[150px] truncate font-bold">{scope === "tenant" ? companyName ?? "KIM-ERB" : "KIM-ERB"}</span>
      </div>
      <div className="hidden w-full max-w-md items-center gap-2 rounded-full bg-slate-50 px-3 lg:flex">
        <Search className="size-4 text-slate-400" strokeWidth={1.8} />
        <Input className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" placeholder={t(locale, "search")} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link href={settingsHref} className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Settings">
          <Settings2 className="size-4" strokeWidth={1.8} />
        </Link>
        <Link href={notificationsHref} className="relative grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell className="size-4" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="hidden items-center gap-3 rounded-full border border-slate-100 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
          <div className="grid size-8 place-items-center rounded-full bg-blue-50 text-xs font-bold text-primary">{initials}</div>
          <span className="text-sm font-medium text-slate-700">{userName}</span>
        </div>
      </div>
    </header>
  );
}
