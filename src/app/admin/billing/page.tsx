import { Receipt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBillingRecordAction, deleteBillingRecordAction, updateBillingStatusAction } from "@/app/admin/billing/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["OPEN", "PAID", "VOID", "OVERDUE"];

export default async function BillingPage() {
  const session = await requireSuperAdmin();
  const [records, subscriptions, currencies] = await Promise.all([
    prisma.billingRecord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { company: true, subscription: { include: { plan: true } } },
      take: 100
    }),
    prisma.subscription.findMany({ where: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE"] } }, include: { company: true, plan: true } }),
    prisma.currency.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { code: "asc" }], take: 30 })
  ]);

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Subscription Billing" description="Billing foundation for subscription invoices and payment state." icon={Receipt} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Billing Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBillingRecordAction} className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.8fr_auto]">
            <select name="subscriptionId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {subscriptions.map((subscription) => (
                <option key={subscription.id} value={subscription.id}>
                  {subscription.company.name} - {subscription.plan.name}
                </option>
              ))}
            </select>
            <Input name="number" placeholder="BILL-2026-001" required />
            <Input name="amount" type="number" step="0.01" placeholder="240" required />
            <select name="currencyCode" defaultValue="LYD" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>{currency.code}</option>
              ))}
            </select>
            <Input name="dueDate" type="date" required />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Number</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Update</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{record.number}</td>
                  <td className="px-5 py-4 text-slate-500">{record.company.name}</td>
                  <td className="px-5 py-4 text-slate-500">{record.subscription.plan.name}</td>
                  <td className="px-5 py-4 text-slate-500">{record.currencyCode} {record.amount.toString()}</td>
                  <td className="px-5 py-4"><Badge variant={record.status === "PAID" ? "success" : record.status === "OVERDUE" ? "danger" : "warning"}>{record.status}</Badge></td>
                  <td className="px-5 py-4">
                    <form action={updateBillingStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={record.id} />
                      <select name="status" defaultValue={record.status} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <Button type="submit" size="sm" variant="outline">Save</Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteBillingRecordAction}>
                      <input type="hidden" name="id" value={record.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
