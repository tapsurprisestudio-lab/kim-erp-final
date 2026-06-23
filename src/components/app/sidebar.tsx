import Link from "next/link";
import {
  Activity,
  BadgeDollarSign,
  Building2,
  Boxes,
  FileText,
  Globe2,
  Headphones,
  Home,
  Languages,
  LockKeyhole,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Tags,
  Ruler,
  Users
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeDollarSign },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/plans", label: "Plans", icon: FileText },
  { href: "/admin/industries", label: "Industries", icon: Building2 },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles & Permissions", icon: LockKeyhole },
  { href: "/admin/currencies", label: "Currencies", icon: Globe2 },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/translations", label: "Translations", icon: Globe2 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/admin/security", label: "Security Center", icon: ShieldCheck },
  { href: "/admin/support", label: "Support Tickets", icon: Headphones },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/erp/products", label: "Products", icon: Package },
  { href: "/erp/categories", label: "Categories", icon: Tags },
  { href: "/erp/units", label: "Units", icon: Ruler },
  { href: "/erp/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/erp/inventory", label: "Inventory", icon: Boxes },
  { href: "/erp/inventory-dashboard", label: "Inventory Dashboard", icon: Boxes },
  { href: "/erp/stock-movements", label: "Stock Movements", icon: Activity }
];

export function Sidebar({ activePath = "/dashboard" }: { activePath?: string }) {
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
          Phase 2
        </div>
        <p className="mt-2 leading-5">Super Admin control, onboarding, global settings, and tenant ERP operations.</p>
      </div>
    </aside>
  );
}
