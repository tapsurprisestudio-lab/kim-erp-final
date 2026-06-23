import { Mail, Send, ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DataTable, DetailList } from "@/components/app/data-table";
import { MetricGrid } from "@/components/app/metric-grid";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const templates = [
  { name: "Company Invitation", trigger: "Company onboarding", channel: "Email + PDF contract", status: "ACTIVE" },
  { name: "User Invitation", trigger: "Platform or tenant user invite", channel: "Email", status: "ACTIVE" },
  { name: "Password Reset", trigger: "Reset request", channel: "Email", status: "ACTIVE" },
  { name: "Welcome", trigger: "Account activation", channel: "Email", status: "ACTIVE" },
  { name: "Account Activation", trigger: "Invitation token", channel: "Email", status: "ACTIVE" }
];

export default async function EmailTemplatesPage() {
  const session = await requireSuperAdmin();
  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="space-y-6">
        <SectionHeader title="Email Templates" description="Transactional email workflows used by onboarding, activation and account recovery." icon={Mail} />
        <MetricGrid
          metrics={[
            { label: "Templates", value: templates.length, icon: Mail, detail: "Core lifecycle messages" },
            { label: "SMTP", value: smtpReady ? "Ready" : "Missing", icon: Send, detail: "Driven by deployment env vars" },
            { label: "Activation", value: "Tokenized", icon: ShieldCheck, detail: "VerificationToken-backed links" },
            { label: "Invitations", value: "Enabled", icon: UserPlus, detail: "Company and user workflows" }
          ]}
        />
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <DataTable
            headers={["Template", "Trigger", "Channel", "Status"]}
            rows={templates.map((template) => [
              template.name,
              template.trigger,
              template.channel,
              <Badge key="status" variant="success">{template.status}</Badge>
            ])}
          />
          <DetailList
            items={[
              { label: "SMTP_HOST", value: process.env.SMTP_HOST ? "Configured" : "Missing" },
              { label: "SMTP_PORT", value: process.env.SMTP_PORT ? "Configured" : "Missing" },
              { label: "SMTP_FROM", value: process.env.SMTP_FROM ? "Configured" : "Missing" },
              { label: "APP_URL", value: process.env.APP_URL ? "Configured" : "Missing" }
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
