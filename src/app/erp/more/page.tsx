import Link from "next/link";
import { Activity, BadgeDollarSign, Building2, CreditCard, FileText, Headphones, Package, Receipt, Settings, Tags } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const links = [
  { href: "/erp/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/erp/products", label: "Products", icon: Package },
  { href: "/erp/categories", label: "Categories", icon: Tags },
  { href: "/erp/stock-movements", label: "Stock Movements", icon: Activity },
  { href: "/erp/quotations", label: "Quotations", icon: FileText },
  { href: "/erp/invoices", label: "Invoices", icon: Receipt },
  { href: "/erp/receipts", label: "Receipts", icon: FileText },
  { href: "/erp/expenses", label: "Expenses", icon: CreditCard },
  { href: "/erp/accounting", label: "Accounting", icon: BadgeDollarSign },
  { href: "/erp/taxes", label: "Taxes", icon: BadgeDollarSign },
  { href: "/erp/documents", label: "Documents", icon: FileText },
  { href: "/erp/support", label: "Help / Support", icon: Headphones }
];

export default async function MorePage() {
  const { session } = await requireTenant();
  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="More" description="Additional ERP modules for this company." icon={Settings} />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="transition hover:border-blue-200 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-semibold text-slate-800">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
