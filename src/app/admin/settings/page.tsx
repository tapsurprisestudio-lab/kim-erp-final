import { Settings } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePlatformSettingsAction } from "@/app/admin/settings/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSuperAdmin();
  const settings = await prisma.translation.findMany({
    where: { languageCode: "en", namespace: "platform_settings", key: { in: ["language", "theme"] } }
  }).catch((error) => {
    console.error("[platform-settings:load-failed]", error);
    return [];
  });
  const language = settings.find((item) => item.key === "language")?.value === "ar" ? "ar" : "en";
  const theme = settings.find((item) => item.key === "theme")?.value === "dark" ? "dark" : "light";
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
            <CardTitle>Platform Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePlatformSettingsAction} className="grid gap-3 sm:grid-cols-3">
              <select name="language" defaultValue={language} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
              <select name="theme" defaultValue={theme} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <Button type="submit">Save Settings</Button>
            </form>
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
