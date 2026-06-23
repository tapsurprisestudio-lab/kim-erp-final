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
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const { session, companyId } = await requireTenant();
  const [suppliers, expenses] = await Promise.all([
    prisma.supplier.findMany({ where: { companyId, deletedAt: null }, include: { _count: { select: { expenses: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.expense.aggregate({ where: { companyId, deletedAt: null }, _sum: { amount: true }, _count: true })
  ]);

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Suppliers" description="Vendor records connected to purchase and expense operations." icon={Factory} />
        <MetricGrid
          metrics={[
            { label: "Suppliers", value: suppliers.length.toLocaleString(), icon: Factory, detail: "Active vendor records" },
            { label: "Expenses", value: expenses._count.toLocaleString(), icon: Factory, detail: "Supplier-linked spending" },
            { label: "Spend", value: formatMoney(Number(expenses._sum.amount ?? 0), "LYD"), icon: Factory, detail: "Recorded tenant expenses" },
            { label: "Tenant", value: session.user.companyName ?? "Company", icon: Factory, detail: "Current workspace" }
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Create supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSupplierAction} className="grid gap-3 md:grid-cols-5">
              <Input name="name" placeholder="Supplier name" required />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="phone" placeholder="Phone" />
              <Input name="taxNumber" placeholder="Tax number" />
              <Input name="address" placeholder="Address" />
              <Button type="submit" className="md:col-span-5">
                <Plus className="size-4" />
                Add Supplier
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          headers={["Name", "Email", "Phone", "Tax Number", "Expenses", "Statement", "Actions"]}
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
              <Button type="submit" size="sm" variant="outline">Delete</Button>
            </form>
          ])}
        />
      </div>
    </AppShell>
  );
}
