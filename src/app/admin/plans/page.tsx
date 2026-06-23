import { BadgeDollarSign, Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPlanAction, togglePlanAction } from "@/app/admin/plans/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await requireSuperAdmin();
  const [plans, currencies] = await Promise.all([
    prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" }, include: { _count: { select: { subscriptions: true } } } }),
    prisma.currency.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { code: "asc" }], take: 30 })
  ]);

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Plans" description="Build and control subscription plans for tenants." icon={BadgeDollarSign} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPlanAction} className="grid gap-3 lg:grid-cols-4">
            <Input name="name" placeholder="Enterprise" required />
            <Input name="monthlyPrice" type="number" step="0.01" placeholder="420" required />
            <Input name="annualPrice" type="number" step="0.01" placeholder="4200" required />
            <select name="currencyCode" className="h-10 rounded-lg border border-input bg-white px-3 text-sm" defaultValue="LYD">
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
            <Input name="maxUsers" type="number" placeholder="60" required />
            <Input name="maxProducts" type="number" placeholder="50000" required />
            <textarea
              name="features"
              className="min-h-24 rounded-lg border border-input bg-white px-3 py-2 text-sm lg:col-span-2"
              placeholder={"Inventory\nInvoices\nReports"}
              required
            />
            <div className="lg:col-span-4">
              <Button type="submit">
                <Plus className="size-4" />
                Save Plan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{plan.key}</p>
                </div>
                <Badge variant={plan.active ? "success" : "secondary"}>{plan.active ? "Active" : "Inactive"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-2xl font-bold text-slate-950">
                {plan.currencyCode} {plan.monthlyPrice.toString()}
                <span className="text-sm font-medium text-slate-400"> / month</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-500">
                <span>Users: {plan.maxUsers}</span>
                <span>Products: {plan.maxProducts}</span>
                <span>Subscriptions: {plan._count.subscriptions}</span>
                <span>Annual: {plan.annualPrice.toString()}</span>
              </div>
              <form action={togglePlanAction}>
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="active" value={String(!plan.active)} />
                <Button type="submit" size="sm" variant="outline">
                  {plan.active ? "Disable" : "Enable"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
