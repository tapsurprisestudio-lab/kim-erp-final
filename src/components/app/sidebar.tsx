import Link from "next/link";
import {
  Activity,
  BarChart3,
  BadgeDollarSign,
  Building2,
  Boxes,
  CreditCard,
  FileText,
  Flag,
  Globe2,
  Headphones,
  Home,
  KeyRound,
  Languages,
  LockKeyhole,
  Mail,
  MonitorCheck,
  Network,
  Bell,
  Plug,
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
import { cn } from "@/lib/utils";

const platformNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/tenants", label: "Tenants", icon: Network },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeDollarSign },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/plans", label: "Plans", icon: FileText },
  { href: "/admin/industries", label: "Industries", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles & Permissions", icon: LockKeyhole },
  { href: "/admin/currencies", label: "Currencies", icon: Globe2 },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/translations", label: "Translations", icon: Globe2 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
  { href: "/admin/security", label: "Security Center", icon: ShieldCheck },
  { href: "/admin/support", label: "Support Tickets", icon: Headphones },
  { href: "/admin/email-templates", label: "Email Templates", icon: Mail },
  { href: "/admin/notifications", label: "Notification Center", icon: Bell },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/monitoring", label: "Monitoring", icon: MonitorCheck },
  { href: "/admin/platform-analytics", label: "Platform Analytics", icon: BarChart3 },
  { href: "/admin/revenue-analytics", label: "Revenue Analytics", icon: BadgeDollarSign },
  { href: "/admin/subscription-analytics", label: "Subscription Analytics", icon: BarChart3 },
  { href: "/admin/growth-metrics", label: "Growth Metrics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const tenantNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/erp/customers", label: "Customers", icon: Users },
  { href: "/erp/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/erp/products", label: "Products", icon: Package },
  { href: "/erp/categories", label: "Categories", icon: Tags },
  { href: "/erp/units", label: "Units", icon: Ruler },
  { href: "/erp/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/erp/inventory", label: "Inventory", icon: Boxes },
  { href: "/erp/inventory-dashboard", label: "Inventory Dashboard", icon: Boxes },
  { href: "/erp/stock-movements", label: "Stock Movements", icon: Activity },
  { href: "/erp/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/erp/sales", label: "Sales", icon: Receipt },
  { href: "/erp/quotations", label: "Quotations", icon: FileText },
  { href: "/erp/invoices", label: "Invoices", icon: Receipt },
  { href: "/erp/payments", label: "Payments", icon: WalletCards },
  { href: "/erp/expenses", label: "Expenses", icon: CreditCard },
  { href: "/erp/accounting", label: "Accounting", icon: BadgeDollarSign },
  { href: "/erp/reports", label: "Reports", icon: BarChart3 },
  { href: "/erp/employees", label: "Employees", icon: UserRound },
  { href: "/erp/hr", label: "HR", icon: Users },
  { href: "/erp/settings", label: "Settings", icon: Settings }
];

export function Sidebar({
  activePath = "/dashboard",
  scope = "platform"
}: {
  activePath?: string;
  scope?: "platform" | "tenant";
}) {
  const nav = scope === "tenant" ? tenantNav : platformNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white/90 px-4 py-5 lg:block">
      <Logo />
      <nav className="mt-8 space-y-1">
        {nav.map((item) => {
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <FileText className="size-4 text-primary" />
          {scope === "tenant" ? "Tenant ERP" : "Platform Admin"}
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
