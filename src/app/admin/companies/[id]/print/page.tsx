import { notFound } from "next/navigation";
import { PrintButton } from "@/components/app/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: { owner: true, industry: true, subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 } }
  });
  if (!company) notFound();
  const rows = [
    ["Company name", company.name],
    ["Commercial registration", company.registrationNo ?? "-"],
    ["Tax number", company.taxNumber ?? "-"],
    ["Industry", company.industry?.name ?? "-"],
    ["Owner", company.owner?.name ?? "-"],
    ["Owner username", company.owner?.username ?? "-"],
    ["Company email", company.email ?? "-"],
    ["Phone", company.phone ?? "-"],
    ["Country / City", [company.country, company.city].filter(Boolean).join(" / ") || "-"],
    ["Language", company.defaultLanguage],
    ["Currency", company.defaultCurrency],
    ["Subscription plan", company.subscriptions[0]?.plan.name ?? "-"],
    ["Activation status", company.status],
    ["Login URL", `${process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`],
    ["Created date", company.createdAt.toLocaleDateString()]
  ];

  return (
    <main className="mx-auto max-w-4xl bg-white p-6 print:p-0">
      <div className="mb-4 print:hidden">
        <PrintButton label="Print company profile" />
      </div>
      <Card>
        <CardContent className="space-y-6 p-8">
          <header className="border-b pb-4">
            <h1 className="text-2xl font-bold text-slate-950">KIM-ERB Company Profile</h1>
            <p className="text-sm text-slate-500">Professional onboarding record</p>
          </header>
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b">
                  <td className="w-1/3 bg-slate-50 p-3 font-semibold text-slate-600">{label}</td>
                  <td className="p-3 text-slate-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="grid grid-cols-2 gap-8 pt-10 text-sm text-slate-500">
            <div className="border-t pt-2">Platform Admin</div>
            <div className="border-t pt-2">Company Owner</div>
          </footer>
        </CardContent>
      </Card>
    </main>
  );
}
