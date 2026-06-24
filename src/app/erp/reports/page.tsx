import { BarChart3, Boxes, Download, FileText, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { session, companyId } = await requireTenant();
  const [company, customers, products, inventory, invoices, expenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.customer.count({ where: { companyId, deletedAt: null } }),
    prisma.product.count({ where: { companyId, deletedAt: null } }),
    prisma.inventoryItem.aggregate({ where: { deletedAt: null, product: { companyId, deletedAt: null } }, _sum: { quantity: true }, _count: true }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true })
  ]);
  const isAr = normalizeLocale(company.defaultLanguage) === "ar";
  const reports = [
    { name: isAr ? "تقرير المبيعات" : "Sales report", metric: formatMoney(Number(invoices._sum.total ?? 0), company.defaultCurrency), records: invoices._count, href: "/api/erp/reports/sales/pdf" },
    { name: isAr ? "تقرير المخزون" : "Inventory report", metric: Number(inventory._sum.quantity ?? 0).toLocaleString(), records: inventory._count, href: "/api/erp/reports/inventory/pdf" },
    { name: isAr ? "تقرير العملاء" : "Customer report", metric: customers.toLocaleString(), records: customers, href: null },
    { name: isAr ? "تقرير المصروفات" : "Expense report", metric: formatMoney(Number(expenses._sum.amount ?? 0), company.defaultCurrency), records: expenses._count, href: null }
  ];

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "التقارير" : "Reports"} description={isAr ? "تقارير مختصرة للمبيعات والمخزون والعملاء والمالية." : "Analytics snapshots for sales, inventory, customers and finance."} icon={BarChart3} />
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-950">
            {isAr ? "استخدم أزرار PDF لتنزيل تقارير جاهزة للطباعة والمشاركة." : "Use the PDF buttons to download print-ready reports you can share."}
          </CardContent>
        </Card>
        <MetricGrid
          metrics={[
            { label: isAr ? "العملاء" : "Customers", value: customers.toLocaleString(), icon: Users, detail: isAr ? "قاعدة العملاء" : "Customer base" },
            { label: isAr ? "المنتجات" : "Products", value: products.toLocaleString(), icon: Boxes, detail: isAr ? "عناصر الكتالوج" : "Catalog items" },
            { label: isAr ? "وحدات المخزون" : "Inventory Units", value: Number(inventory._sum.quantity ?? 0).toLocaleString(), icon: Boxes, detail: isAr ? "الكمية المتاحة" : "On-hand quantity" },
            { label: isAr ? "الإيرادات" : "Revenue", value: formatMoney(Number(invoices._sum.total ?? 0), company.defaultCurrency), icon: FileText, detail: isAr ? "إجمالي الفواتير" : "Invoice total" }
          ]}
        />
        <DataTable
          headers={isAr ? ["التقرير", "المؤشر الرئيسي", "السجلات", "PDF"] : ["Report", "Primary Metric", "Records", "PDF"]}
          rows={reports.map((report) => [
            report.name,
            report.metric,
            report.records.toLocaleString(),
            report.href ? (
              <Button key="pdf" size="sm" variant="outline" asChild>
                <Link href={report.href}>
                  <Download className="size-4" />
                  PDF
                </Link>
              </Button>
            ) : "-"
          ])}
        />
      </div>
    </AppShell>
  );
}
