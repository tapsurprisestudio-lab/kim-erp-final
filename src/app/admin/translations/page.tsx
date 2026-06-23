import { Globe2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteTranslationAction, saveTranslationAction } from "@/app/admin/translations/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TranslationsPage() {
  const session = await requireSuperAdmin();
  const [translations, languages] = await Promise.all([
    prisma.translation.findMany({
      where: { deletedAt: null },
      orderBy: [{ namespace: "asc" }, { key: "asc" }],
      include: { language: true },
      take: 150
    }),
    prisma.language.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { code: "asc" }] })
  ]);

  return (
    <AppShell userName={session.user.name}>
      <SectionHeader title="Translations" description="Global translation foundation for namespaces and language-specific copy." icon={Globe2} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Create Translation</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveTranslationAction} className="grid gap-3 lg:grid-cols-[0.7fr_1fr_1fr_2fr_auto]">
            <select name="languageCode" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
            <Input name="namespace" placeholder="dashboard" required />
            <Input name="key" placeholder="title" required />
            <Input name="value" placeholder="Dashboard" required />
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Namespace</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {translations.map((translation) => (
                <tr key={translation.id}>
                  <td className="px-5 py-4 text-slate-500">{translation.language.name}</td>
                  <td className="px-5 py-4 text-slate-500">{translation.namespace}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{translation.key}</td>
                  <td className="px-5 py-4">
                    <form action={saveTranslationAction} className="grid min-w-[640px] grid-cols-[0.7fr_1fr_1fr_2fr_auto] gap-2">
                      <input type="hidden" name="id" value={translation.id} />
                      <select name="languageCode" defaultValue={translation.languageCode} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                        {languages.map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.code}
                          </option>
                        ))}
                      </select>
                      <Input name="namespace" defaultValue={translation.namespace} className="h-9" />
                      <Input name="key" defaultValue={translation.key} className="h-9" />
                      <Input name="value" defaultValue={translation.value} className="h-9" />
                      <Button type="submit" size="sm" variant="outline">Save</Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteTranslationAction}>
                      <input type="hidden" name="id" value={translation.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Trash2 className="size-4" />
                        Delete
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
