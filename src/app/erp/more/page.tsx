import Link from "next/link";
import { Activity, BadgeDollarSign, Building2, CreditCard, FileText, Headphones, Package, Receipt, Settings, Tags } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeLocale, t, type TranslationKey } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const links = [
  { href: "/erp/suppliers", labelKey: "suppliers", icon: Building2 },
  { href: "/erp/products", labelKey: "products", icon: Package },
  { href: "/erp/categories", labelKey: "categories", icon: Tags },
  { href: "/erp/stock-movements", labelKey: "stockMovements", icon: Activity },
  { href: "/erp/quotations", labelKey: "quotations", icon: FileText },
  { href: "/erp/invoices", labelKey: "invoices", icon: Receipt },
  { href: "/erp/receipts", labelKey: "receipts", icon: FileText },
  { href: "/erp/expenses", labelKey: "expenses", icon: CreditCard },
  { href: "/erp/accounting", labelKey: "accounting", icon: BadgeDollarSign },
  { href: "/erp/taxes", labelKey: "taxes", icon: BadgeDollarSign },
  { href: "/erp/documents", labelKey: "documents", icon: FileText },
  { href: "/erp/support", labelKey: "helpSupport", icon: Headphones }
];

export default async function MorePage() {
  const { session, companyId } = await requireTenant();
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } });
  const locale = normalizeLocale(company?.defaultLanguage);
  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={t(locale, "more")} description={t(locale, "additionalErpModules")} icon={Settings} />
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
                    <span className="font-semibold text-slate-800">{t(locale, link.labelKey as TranslationKey)}</span>
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
