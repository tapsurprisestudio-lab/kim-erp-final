import { KeyRound, LockKeyhole, Server, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable, DetailList } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await requireSuperAdmin();
  const [sessions, accounts, failedAttempts] = await Promise.all([
    prisma.session.count(),
    prisma.account.count(),
    prisma.loginAttempt.count({ where: { success: false } })
  ]);
  const entries = [
    { name: "NextAuth Secret", purpose: "Session signing", configured: Boolean(process.env.NEXTAUTH_SECRET) },
    { name: "Database URL", purpose: "Prisma connection", configured: Boolean(process.env.DATABASE_URL) },
    { name: "SMTP Credentials", purpose: "Transactional email", configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM) },
    { name: "App URL", purpose: "Activation and reset links", configured: Boolean(process.env.APP_URL || process.env.NEXTAUTH_URL) }
  ];

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="API Keys" description="Secret readiness and connected auth providers without exposing secret values." icon={KeyRound} />
        <MetricGrid
          metrics={[
            { label: "Secret Checks", value: entries.length, icon: KeyRound, detail: "Deployment variables inspected" },
            { label: "Sessions", value: sessions.toLocaleString(), icon: ShieldCheck, detail: "Active persisted sessions" },
            { label: "OAuth Accounts", value: accounts.toLocaleString(), icon: Server, detail: "External provider links" },
            { label: "Failed Logins", value: failedAttempts.toLocaleString(), icon: LockKeyhole, detail: "Credential risk signal" }
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <DataTable
            headers={["Secret", "Purpose", "Configured"]}
            rows={entries.map((entry) => [
              entry.name,
              entry.purpose,
              <Badge key="configured" variant={entry.configured ? "success" : "warning"}>
                {entry.configured ? "CONFIGURED" : "MISSING"}
              </Badge>
            ])}
          />
          <DetailList
            items={[
              { label: "Secret exposure", value: "Masked" },
              { label: "Storage", value: "Environment variables" },
              { label: "Rotation", value: "Deploy-time update" }
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
