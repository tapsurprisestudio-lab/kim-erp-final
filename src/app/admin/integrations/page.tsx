import { Database, Link2, Mail, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await requireSuperAdmin();
  const [companies, accounts, currencies, languages] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.account.count(),
    prisma.currency.count({ where: { active: true } }),
    prisma.language.count({ where: { active: true } })
  ]);
  const integrations = [
    { name: "PostgreSQL", type: "Database", status: Boolean(process.env.DATABASE_URL), icon: "Database" },
    { name: "SMTP", type: "Email", status: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM), icon: "Mail" },
    { name: "NextAuth", type: "Authentication", status: Boolean(process.env.NEXTAUTH_SECRET), icon: "Shield" },
    { name: "Currency Registry", type: "Reference Data", status: currencies > 0, icon: "Database" },
    { name: "Language Registry", type: "Localization", status: languages > 0, icon: "Database" }
  ];

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Integrations" description="Platform dependencies and external service readiness." icon={Link2} />
        <MetricGrid
          metrics={[
            { label: "Integrations", value: integrations.length, icon: Link2, detail: "Tracked connections" },
            { label: "Tenants", value: companies.toLocaleString(), icon: Database, detail: "Database consumers" },
            { label: "Auth Accounts", value: accounts.toLocaleString(), icon: ShieldCheck, detail: "Provider links" },
            { label: "Email Service", value: integrations[1].status ? "Ready" : "Missing", icon: Mail, detail: "SMTP env status" }
          ]}
        />
        <DataTable
          headers={["Integration", "Type", "Health", "Reference"]}
          rows={integrations.map((integration) => [
            integration.name,
            integration.type,
            <Badge key="health" variant={integration.status ? "success" : "warning"}>
              {integration.status ? "READY" : "NEEDS CONFIG"}
            </Badge>,
            integration.icon
          ])}
        />
      </div>
    </AppShell>
  );
}
