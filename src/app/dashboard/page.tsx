import {
  BadgeDollarSign,
  Building2,
  Clock3,
  FileText,
  Package,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getPlatformMetrics() {
  const [companies, subscriptions, invoices, users, expiringSoon, recentLogs] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.subscription.count({
      where: {
        status: { in: ["ACTIVE", "TRIAL"] },
        endsAt: {
          lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
        }
      }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true, company: true }
    })
  ]);

  return {
    kpis: [
      { label: "Total Companies", value: companies.toLocaleString(), delta: "+12.5%", icon: Building2 },
      { label: "Active Subscriptions", value: subscriptions.toLocaleString(), delta: "+8.2%", icon: BadgeDollarSign },
      {
        label: "Monthly Revenue",
        value: formatMoney(Number(invoices._sum.total ?? 0), "LYD"),
        delta: "+15.3%",
        icon: TrendingUp
      },
      { label: "Expiring Soon", value: expiringSoon.toLocaleString(), delta: "-2.7%", icon: Clock3 }
    ],
    users,
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actor: log.user?.name ?? "System",
      companyName: log.company?.name
    }))
  };
}

async function getCompanyMetrics(companyId: string) {
  const [products, customers, invoices, inventory, recentLogs] = await Promise.all([
    prisma.product.count({ where: { companyId, deletedAt: null } }),
    prisma.customer.count({ where: { companyId, deletedAt: null } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId, deletedAt: null } }),
    prisma.inventoryItem.aggregate({ _sum: { quantity: true }, where: { deletedAt: null, product: { companyId, deletedAt: null } } }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true }
    })
  ]);

  return {
    kpis: [
      { label: "Products", value: products.toLocaleString(), delta: "+6.4%", icon: Package },
      { label: "Customers", value: customers.toLocaleString(), delta: "+12.1%", icon: Users },
      { label: "Sales", value: formatMoney(Number(invoices._sum.total ?? 0), "LYD"), delta: "+9.8%", icon: TrendingUp },
      { label: "Stock Units", value: Number(inventory._sum.quantity ?? 0).toLocaleString(), delta: "+3.1%", icon: FileText }
    ],
    users: customers,
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actor: log.user?.name ?? "System",
      companyName: undefined
    }))
  };
}

export default async function DashboardPage() {
  const session = await requireSession();
  const isSuperAdmin = session.user.roles.includes("super_admin");
  const metrics = isSuperAdmin
    ? await getPlatformMetrics()
    : await getCompanyMetrics(session.user.companyId as string);

  return (
    <AppShell userName={session.user.name} scope={isSuperAdmin ? "platform" : "tenant"}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSuperAdmin ? "Platform-wide control center" : `${session.user.companyName ?? "Company"} workspace`}
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="mr-1 size-3" />
            Tenant protected
          </Badge>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-slate-500">{kpi.label}</p>
                    <div className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{kpi.value}</div>
                    <p className="mt-1 text-xs font-medium text-emerald-600">{kpi.delta}</p>
                  </div>
                  <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-end gap-3 rounded-xl bg-slate-50 p-4">
                {[38, 62, 45, 72, 58, 86, 52].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-sky-300"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-400">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.recentLogs.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No activity has been logged yet.</p>
              ) : (
                metrics.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <div className="mt-0.5 grid size-8 place-items-center rounded-lg bg-white text-primary">
                      <Users className="size-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{log.action}</p>
                      <p className="text-xs text-slate-500">
                        {log.actor} {log.companyName ? `- ${log.companyName}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
