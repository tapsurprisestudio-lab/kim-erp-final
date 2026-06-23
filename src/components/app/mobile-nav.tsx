import Link from "next/link";
import { Building2, FileText, Home, Settings, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/erp/products", label: "Products", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "More", icon: Settings }
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-soft backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-500">
            <Icon className="size-4" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
