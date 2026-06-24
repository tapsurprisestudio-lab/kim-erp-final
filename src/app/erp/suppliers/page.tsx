import { Download, Factory, Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupplierAction, deleteSupplierAction } from "@/app/erp/suppliers/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const { session, companyId } = await requireTenantPermission("suppliers.manage");
  const [company, suppliers, expenses] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.supplier.findMany({ where: { companyId, deletedAt: null }, include: { _count: { select: { expenses: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "الموردون" : "Suppliers"} description={isAr ? "سجلات الموردين المرتبطة بالمشتريات والمصروفات." : "Vendor records connected to purchase and expense operations."} icon={Factory} />
        <MetricGrid
          metrics={[
            { label: isAr ? "الموردون" : "Suppliers", value: suppliers.length.toLocaleString(), icon: Factory, detail: isAr ? "سجلات نشطة" : "Active vendor records" },
            { label: isAr ? "المصروفات" : "Expenses", value: expenses._count.toLocaleString(), icon: Factory, detail: isAr ? "مصروفات مرتبطة بالموردين" : "Supplier-linked spending" },
            { label: isAr ? "الإنفاق" : "Spend", value: formatMoney(Number(expenses._sum.amount ?? 0), "LYD"), icon: Factory, detail: isAr ? "مصروفات مسجلة" : "Recorded tenant expenses" },
            { label: isAr ? "الشركة" : "Tenant", value: session.user.companyName ?? (isAr ? "الشركة" : "Company"), icon: Factory, detail: isAr ? "مساحة العمل الحالية" : "Current workspace" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "إنشاء مورد" : "Create supplier"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSupplierAction} className="grid gap-3 md:grid-cols-5">
              <Input name="name" placeholder={isAr ? "اسم المورد" : "Supplier name"} required />
              <Input name="email" type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} />
              <Input name="phone" placeholder={isAr ? "الهاتف" : "Phone"} />
              <Input name="taxNumber" placeholder={isAr ? "الرقم الضريبي" : "Tax number"} />
              <Input name="address" placeholder={isAr ? "العنوان" : "Address"} />
              <Button type="submit" className="md:col-span-5">
                <Plus className="size-4" />
                {isAr ? "إضافة مورد" : "Add Supplier"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={isAr ? ["الاسم", "البريد", "الهاتف", "الرقم الضريبي", "المصروفات", "كشف الحساب", "الإجراءات"] : ["Name", "Email", "Phone", "Tax Number", "Expenses", "Statement", "Actions"]}
          rows={suppliers.map((supplier) => [
            supplier.name,
            supplier.email ?? "-",
            supplier.phone ?? "-",
            supplier.taxNumber ?? "-",
            supplier._count.expenses.toLocaleString(),
            <Button key="statement" size="sm" variant="outline" asChild>
              <Link href={`/api/erp/suppliers/${supplier.id}/statement-pdf`}>
                <Download className="size-4" />
                PDF
              </Link>
            </Button>,
            <form key="delete" action={deleteSupplierAction}>
              <input type="hidden" name="id" value={supplier.id} />
              <Button type="submit" size="sm" variant="outline">{isAr ? "حذف" : "Delete"}</Button>
            </form>
          ])}
        />
      </div>
    </AppShell>
  );
}
