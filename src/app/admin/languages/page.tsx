import { Languages, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { syncMajorLanguagesAction, toggleLanguageAction, upsertLanguageAction } from "@/app/admin/languages/actions";

export const dynamic = "force-dynamic";

export default async function LanguagesPage() {
  const session = await requireSuperAdmin();
  const languages = await prisma.language.findMany({
    orderBy: [{ priority: "asc" }, { code: "asc" }]
  });

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader
        title="Languages"
        description="Manage language availability and text direction. Arabic is seeded as RTL and prioritized."
        icon={Languages}
      >
        <form action={syncMajorLanguagesAction}>
          <Button type="submit" variant="outline">
            <RefreshCw className="size-4" />
            Sync Major Languages
          </Button>
        </form>
      </SectionHeader>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add or Update Language</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertLanguageAction} className="grid gap-3 md:grid-cols-[0.6fr_1fr_1fr_0.7fr_auto]">
            <Input name="code" placeholder="ar" required />
            <Input name="name" placeholder="Arabic" required />
            <Input name="nativeName" placeholder="العربية" required />
            <select name="direction" className="h-10 rounded-lg border border-input bg-white px-3 text-sm" defaultValue="LTR">
              <option value="LTR">LTR</option>
              <option value="RTL">RTL</option>
            </select>
            <Button type="submit">
              <Plus className="size-4" />
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Language Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3">Language</th>
                  <th className="py-3">Native Name</th>
                  <th className="py-3">Code</th>
                  <th className="py-3">Direction</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {languages.map((language) => (
                  <tr key={language.code}>
                    <td className="py-4 font-medium text-slate-800">{language.name}</td>
                    <td className="py-4 text-slate-500">{language.nativeName}</td>
                    <td className="py-4 text-slate-500">{language.code}</td>
                    <td className="py-4 text-slate-500">{language.direction}</td>
                    <td className="py-4">
                      <Badge variant={language.active ? "success" : "secondary"}>{language.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="py-4 text-right">
                      <form action={toggleLanguageAction}>
                        <input type="hidden" name="code" value={language.code} />
                        <input type="hidden" name="active" value={String(!language.active)} />
                        <Button type="submit" size="sm" variant="outline">
                          {language.active ? "Disable" : "Enable"}
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
