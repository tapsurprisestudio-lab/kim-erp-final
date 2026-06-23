import Link from "next/link";
import { Boxes, Building2, Home, Receipt, Settings, Users } from "lucide-react";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const platformItems = [
  { href: "/dashboard", labelKey: "platformDashboard", icon: Home },
  { href: "/admin/companies", labelKey: "companies", icon: Building2 },
  { href: "/admin/billing", labelKey: "billing", icon: Receipt },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/settings", labelKey: "more", icon: Settings }
];

const tenantItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: Home },
  { href: "/erp/sales", labelKey: "sales", icon: Receipt },
  { href: "/erp/inventory-dashboard", labelKey: "inventory", icon: Boxes },
  { href: "/erp/customers", labelKey: "customers", icon: Users },
  { href: "/erp/more", labelKey: "more", icon: Settings }
];

export function MobileNav({ scope = "platform", locale = "en" }: { scope?: "platform" | "tenant"; locale?: Locale }) {
  const items = scope === "tenant" ? tenantItems : platformItems;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-soft backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-500">
            <Icon className="size-4" strokeWidth={1.8} />
            {t(locale, item.labelKey as TranslationKey)}
          </Link>
        );
      })}
    </nav>
  );
}
