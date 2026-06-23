import { Settings } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSuperAdmin();
  const env = [
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
    ["NEXTAUTH_SECRET", Boolean(process.env.NEXTAUTH_SECRET)],
    ["NEXTAUTH_URL", Boolean(process.env.NEXTAUTH_URL)],
    ["SMTP_HOST", Boolean(process.env.SMTP_HOST)],
    ["SMTP_FROM", Boolean(process.env.SMTP_FROM)],
    ["APP_URL", Boolean(process.env.APP_URL)]
  ];

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Settings" description="Platform contact details and deployment readiness." icon={Settings} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div>Email: kimerb10@gmail.com</div>
            <div>WhatsApp: +49 177 7952971</div>
            <div>Main target currency: LYD Libyan Dinar</div>
            <div>Required languages: Arabic RTL and English LTR</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {env.map(([key, configured]) => (
              <div key={String(key)} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-medium text-slate-700">{key}</span>
                <Badge variant={configured ? "success" : "warning"}>{configured ? "Configured" : "Missing"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
