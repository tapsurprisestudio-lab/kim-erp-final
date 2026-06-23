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
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { session, companyId } = await requireTenant();
  const [customers, invoiceTotal, quoteTotal] = await Promise.all([
    prisma.customer.findMany({ where: { companyId, deletedAt: null }, include: { _count: { select: { invoices: true, quotations: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.count({ where: { companyId, deletedAt: null } }),
    prisma.quotation.count({ where: { companyId, deletedAt: null } })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Customers" description="Tenant-isolated customer accounts and sales relationships." icon={Users} />
        <MetricGrid
          metrics={[
            { label: "Customers", value: customers.length.toLocaleString(), icon: Users, detail: "Active customer records" },
            { label: "Invoices", value: invoiceTotal.toLocaleString(), icon: Users, detail: "Customer billing documents" },
            { label: "Quotations", value: quoteTotal.toLocaleString(), icon: Users, detail: "Open and archived offers" },
            { label: "Tenant", value: session.user.companyName ?? "Company", icon: Users, detail: "Current workspace" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Create customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCustomerAction} className="grid gap-3 md:grid-cols-4">
              <Input name="name" placeholder="Customer name" required />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="phone" placeholder="Phone" />
              <Input name="taxNumber" placeholder="Tax number" />
              <Input name="city" placeholder="City" />
              <Input name="country" placeholder="Country" />
              <Input className="md:col-span-2" name="address" placeholder="Address" />
              <Button type="submit" className="md:col-span-4">
                <Plus className="size-4" />
                Add Customer
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Name", "Email", "Phone", "Location", "Documents", "Statement", "Actions"]}
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
              <Button type="submit" size="sm" variant="outline">Delete</Button>
            </form>
          ])}
        />
      </div>
    </AppShell>
  );
}
