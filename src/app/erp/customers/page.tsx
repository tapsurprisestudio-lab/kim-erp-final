import { Download, Plus, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCustomerAction, deleteCustomerAction } from "@/app/erp/customers/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { session, companyId } = await requireTenant();
  const [company, customers, invoiceTotal, quoteTotal] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.customer.findMany({ where: { companyId, deletedAt: null }, include: { _count: { select: { invoices: true, quotations: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.count({ where: { companyId, deletedAt: null } }),
    prisma.quotation.count({ where: { companyId, deletedAt: null } })
  ]);
  const isAr = normalizeLocale(company?.defaultLanguage) === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title={isAr ? "العملاء" : "Customers"} description={isAr ? "أضف العملاء هنا لتتبع المبيعات والديون وكشوف الحساب." : "Add customers here to track sales, debts and statements."} icon={Users} />
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-950">
            {isAr ? "ابدأ باسم العميل فقط، ويمكنك إضافة البريد والهاتف والرقم الضريبي لاحقا." : "Start with the customer name only; email, phone and tax number can be added later."}
          </CardContent>
        </Card>
        <MetricGrid
          metrics={[
            { label: isAr ? "العملاء" : "Customers", value: customers.length.toLocaleString(), icon: Users, detail: isAr ? "سجلات العملاء النشطة" : "Active customer records" },
            { label: isAr ? "الفواتير" : "Invoices", value: invoiceTotal.toLocaleString(), icon: Users, detail: isAr ? "مستندات الفوترة" : "Customer billing documents" },
            { label: isAr ? "عروض الأسعار" : "Quotations", value: quoteTotal.toLocaleString(), icon: Users, detail: isAr ? "العروض المفتوحة والمؤرشفة" : "Open and archived offers" },
            { label: isAr ? "الشركة" : "Tenant", value: session.user.companyName ?? (isAr ? "الشركة" : "Company"), icon: Users, detail: isAr ? "مساحة العمل الحالية" : "Current workspace" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "إنشاء عميل" : "Create customer"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCustomerAction} className="grid gap-3 md:grid-cols-4">
              <Input name="name" placeholder={isAr ? "اسم العميل" : "Customer name"} required />
              <Input name="email" type="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} />
              <Input name="phone" placeholder={isAr ? "الهاتف" : "Phone"} />
              <Input name="taxNumber" placeholder={isAr ? "الرقم الضريبي" : "Tax number"} />
              <Input name="city" placeholder={isAr ? "المدينة" : "City"} />
              <Input name="country" placeholder={isAr ? "الدولة" : "Country"} />
              <Input className="md:col-span-2" name="address" placeholder={isAr ? "العنوان" : "Address"} />
              <Button type="submit" className="md:col-span-4">
                <Plus className="size-4" />
                {isAr ? "إضافة عميل" : "Add Customer"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={isAr ? ["الاسم", "البريد", "الهاتف", "الموقع", "المستندات", "كشف الحساب", "الإجراءات"] : ["Name", "Email", "Phone", "Location", "Documents", "Statement", "Actions"]}
          rows={customers.map((customer) => [
            customer.name,
            customer.email ?? "-",
            customer.phone ?? "-",
            [customer.city, customer.country].filter(Boolean).join(", ") || "-",
            `${customer._count.invoices} invoices / ${customer._count.quotations} quotes`,
            <Button key="statement" size="sm" variant="outline" asChild>
              <Link href={`/api/erp/customers/${customer.id}/statement-pdf`}>
                <Download className="size-4" />
                PDF
              </Link>
            </Button>,
            <form key="delete" action={deleteCustomerAction}>
              <input type="hidden" name="id" value={customer.id} />
              <Button type="submit" size="sm" variant="outline">{isAr ? "حذف" : "Delete"}</Button>
            </form>
          ])}
        />
      </div>
    </AppShell>
  );
}
