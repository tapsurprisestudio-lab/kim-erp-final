import { BadgeDollarSign, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { renewSubscriptionAction, updateSubscriptionStatusAction } from "@/app/admin/subscriptions/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];

export default async function SubscriptionsPage() {
  const session = await requireSuperAdmin();
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { endsAt: "asc" },
    include: { company: true, plan: true },
    take: 100
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Subscriptions" description="Renew, cancel, and monitor tenant subscription state." icon={BadgeDollarSign} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Ends</th>
                <th className="px-5 py-3">Update</th>
                <th className="px-5 py-3 text-right">Renew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{subscription.company.name}</td>
                  <td className="px-5 py-4 text-slate-500">{subscription.plan.name}</td>
                  <td className="px-5 py-4">
                    <Badge variant={subscription.status === "ACTIVE" ? "success" : subscription.status === "CANCELLED" ? "danger" : "warning"}>
                      {subscription.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{subscription.endsAt.toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <form action={updateSubscriptionStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={subscription.id} />
                      <select name="status" defaultValue={subscription.status} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={renewSubscriptionAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={subscription.id} />
                      <input type="hidden" name="months" value="1" />
                      <Button type="submit" size="sm">
                        <RefreshCw className="size-4" />
                        1 Month
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
