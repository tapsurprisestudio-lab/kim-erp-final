import { Globe2, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { syncIsoCurrenciesAction, toggleCurrencyAction, upsertCurrencyAction } from "@/app/admin/currencies/actions";

export const dynamic = "force-dynamic";

export default async function CurrenciesPage() {
  const session = await requireSuperAdmin();
  const currencies = await prisma.currency.findMany({
    orderBy: [{ priority: "asc" }, { code: "asc" }],
    take: 80
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader
        title="Currencies"
        description="Manage ISO 4217 currencies, exchange rates, and company defaults. LYD is always prioritized."
        icon={Globe2}
      >
        <form action={syncIsoCurrenciesAction}>
          <Button type="submit" variant="outline">
            <RefreshCw className="size-4" />
            Sync ISO 4217
          </Button>
        </form>
      </SectionHeader>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add or Update Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertCurrencyAction} className="grid gap-3 md:grid-cols-[0.7fr_1.4fr_0.7fr_0.8fr_auto]">
            <Input name="code" placeholder="LYD" maxLength={3} required />
            <Input name="name" placeholder="Libyan Dinar" required />
            <Input name="symbol" placeholder="ل.د" required />
            <Input name="exchangeRate" type="number" step="0.000001" defaultValue="1" required />
            <Button type="submit">
              <Plus className="size-4" />
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Currency Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3">Currency</th>
                  <th className="py-3">Code</th>
                  <th className="py-3">Symbol</th>
                  <th className="py-3">Rate</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencies.map((currency) => (
                  <tr key={currency.code}>
                    <td className="py-4 font-medium text-slate-800">{currency.name}</td>
                    <td className="py-4 text-slate-500">{currency.code}</td>
                    <td className="py-4 text-slate-500">{currency.symbol}</td>
                    <td className="py-4 text-slate-500">{currency.exchangeRate.toString()}</td>
                    <td className="py-4">
                      <Badge variant={currency.active ? "success" : "secondary"}>{currency.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="py-4 text-right">
                      <form action={toggleCurrencyAction}>
                        <input type="hidden" name="code" value={currency.code} />
                        <input type="hidden" name="active" value={String(!currency.active)} />
                        <Button type="submit" size="sm" variant="outline">
                          {currency.active ? "Disable" : "Enable"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
