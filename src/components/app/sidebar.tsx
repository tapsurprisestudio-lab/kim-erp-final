import Link from "next/link";
import {
  Activity,
  BarChart3,
  BadgeDollarSign,
  Building2,
  Boxes,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Home,
  Languages,
  LockKeyhole,
  Mail,
  Network,
  Bell,
  Package,
  Receipt,
  ShoppingCart,
  Settings,
  ShieldCheck,
  Tags,
  Ruler,
  Users,
  UserRound,
  WalletCards
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const platformNav = [
  { href: "/dashboard", labelKey: "platformDashboard", icon: Home },
  { href: "/admin/companies", labelKey: "companies", icon: Building2 },
  { href: "/admin/subscriptions", labelKey: "subscriptions", icon: BadgeDollarSign },
  { href: "/admin/plans", labelKey: "plans", icon: FileText },
  { href: "/admin/billing", labelKey: "billing", icon: Receipt },
  { href: "/admin/payments", labelKey: "payments", icon: CreditCard },
  { href: "/admin/tenants", labelKey: "tenants", icon: Network },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/roles", labelKey: "roles", icon: LockKeyhole },
  { href: "/admin/industries", labelKey: "industries", icon: Building2 },
  { href: "/admin/languages", labelKey: "languages", icon: Languages },
  { href: "/admin/currencies", labelKey: "currencies", icon: Globe2 },
  { href: "/admin/audit-logs", labelKey: "auditLogs", icon: Activity },
  { href: "/admin/security", labelKey: "security", icon: ShieldCheck },
  { href: "/admin/support", labelKey: "support", icon: Headphones },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
  { href: "/admin/email-templates", labelKey: "emailTemplates", icon: Mail },
  { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
  { href: "/admin/platform-messages", labelKey: "platformMessages", icon: Mail },
  { href: "/admin/activity-logs", labelKey: "activityLogs", icon: Activity },
  { href: "/admin/platform-analytics", labelKey: "platformAnalytics", icon: BarChart3 },
  { href: "/admin/revenue-analytics", labelKey: "revenueAnalytics", icon: BadgeDollarSign },
  { href: "/admin/growth-metrics", labelKey: "growthMetrics", icon: BarChart3 },
];

const tenantNav = [
  { href: "/dashboard", labelKey: "dashboard", icon: Home },
  { href: "/erp/customers", labelKey: "customers", icon: Users },
  { href: "/erp/sales", labelKey: "sales", icon: Receipt },
  { href: "/erp/inventory-dashboard", labelKey: "inventory", icon: Boxes },
  { href: "/erp/purchases", labelKey: "purchases", icon: ShoppingCart },
  { href: "/erp/payments-debts", labelKey: "paymentsDebts", icon: WalletCards },
  { href: "/erp/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/erp/sales-representatives", labelKey: "salesRepresentatives", icon: UserRound },
  { href: "/erp/employees", labelKey: "employees", icon: Users },
  { href: "/erp/settings", labelKey: "settings", icon: Settings }
];

const tenantMoreNav = [
  { href: "/erp/suppliers", labelKey: "suppliers", icon: Building2 },
  { href: "/erp/products", labelKey: "products", icon: Package },
  { href: "/erp/categories", labelKey: "categories", icon: Tags },
  { href: "/erp/units", labelKey: "units", icon: Ruler },
  { href: "/erp/warehouses", labelKey: "warehouses", icon: Building2 },
  { href: "/erp/stock-movements", labelKey: "stockMovements", icon: Activity },
  { href: "/erp/quotations", labelKey: "quotations", icon: FileText },
  { href: "/erp/invoices", labelKey: "invoices", icon: Receipt },
  { href: "/erp/receipts", labelKey: "receipts", icon: FileText },
  { href: "/erp/expenses", labelKey: "expenses", icon: CreditCard },
  { href: "/erp/accounting", labelKey: "accounting", icon: BadgeDollarSign },
  { href: "/erp/taxes", labelKey: "taxes", icon: BadgeDollarSign },
  { href: "/erp/documents", labelKey: "documents", icon: FileText },
  { href: "/erp/notifications", labelKey: "notifications", icon: Bell },
  { href: "/erp/audit-logs", labelKey: "auditLogs", icon: Activity },
  { href: "/erp/support", labelKey: "helpSupport", icon: Headphones }
];

export function Sidebar({
  activePath = "/dashboard",
  scope = "platform",
  locale = "en",
  companyName,
  companyLogoUrl
}: {
  activePath?: string;
  scope?: "platform" | "tenant";
  locale?: Locale;
  companyName?: string | null;
  companyLogoUrl?: string | null;
}) {
  const nav = scope === "tenant" ? tenantNav : platformNav;
  const groups = scope === "tenant" ? [nav, tenantMoreNav] : [nav];

  return (
    <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-slate-100 bg-white/90 px-4 py-5 lg:block">
      {scope === "tenant" && companyLogoUrl ? (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${companyLogoUrl})` }} aria-label={companyName ?? "Company logo"} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-950">{companyName}</div>
            <div className="text-xs text-slate-500">KIM-ERB</div>
          </div>
        </div>
      ) : (
        <Logo />
      )}
      <nav className="mt-8 space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {scope === "tenant" && groupIndex === 1 && (
              <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-normal text-slate-400">{t(locale, "more")}</div>
            )}
            {group.map((item) => {
              const Icon = item.icon;
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-blue-50 hover:text-primary",
                    active && "bg-blue-50 text-primary"
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  <span>{t(locale, item.labelKey as TranslationKey)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <FileText className="size-4 text-primary" />
          {scope === "tenant" ? t(locale, "companyWorkspace") : "Platform Admin"}
        </div>
        <p className="mt-2 leading-5">
          {scope === "tenant"
            ? "Company-isolated operations, inventory, sales, finance, and reports."
            : "Platform control, tenants, billing, security, support, analytics, and settings."}
        </p>
      </div>
    </aside>
  );
}
