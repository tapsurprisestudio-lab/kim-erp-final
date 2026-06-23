import { Building2, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resendCompanyWelcomeEmailAction, softDeleteCompanyAction, updateCompanyStatusAction } from "@/app/admin/companies/[id]/actions";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CompanyDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; resent?: string; email?: string; username?: string }>;
}) {
  const session = await requireSuperAdmin();
  const { id } = await params;
  const query = await searchParams;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      owner: true,
      industry: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          users: true,
          products: true,
          customers: true,
          invoices: true,
          warehouses: true
        }
      }
    }
  });
  if (!company || company.deletedAt) notFound();

  return (
    <AppShell userName={session.user.name} scope="platform">
      <SectionHeader title={company.name} description="Tenant company profile, lifecycle, and operational footprint." icon={Building2}>
        <Button variant="outline" asChild>
          <Link href="/admin/companies">Back</Link>
        </Button>
      </SectionHeader>
      {(query.created || query.resent) && (
        <Card className={`mb-5 ${query.email === "skipped" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <CardContent className="p-5">
            <p className={`font-semibold ${query.email === "skipped" ? "text-amber-800" : "text-emerald-800"}`}>
              {query.email === "skipped"
                ? "Company created, but welcome email was not sent because email service is not configured."
                : query.created
                  ? "Company created successfully. Owner account activated and welcome email sent."
                  : "Welcome email sent."}
            </p>
            <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <div>Owner username: <span className="font-semibold">{query.username ?? company.owner?.username ?? "-"}</span></div>
              <div>Login URL: <span className="font-semibold">{process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/login</span></div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ["Owner", company.owner?.name ?? "Unassigned"],
              ["Email", company.email ?? company.owner?.email ?? "-"],
              ["Industry", company.industry?.name ?? "-"],
              ["Currency", company.defaultCurrency],
              ["Language", company.defaultLanguage],
              ["Location", [company.city, company.country].filter(Boolean).join(", ") || "-"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs uppercase text-slate-400">{label}</div>
                <div className="mt-1 font-medium text-slate-800">{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={company.status === "ACTIVE" ? "success" : company.status === "SUSPENDED" ? "danger" : "warning"}>
              {company.status}
            </Badge>
            <form action={updateCompanyStatusAction} className="flex gap-2">
              <input type="hidden" name="id" value={company.id} />
              <select name="status" defaultValue={company.status} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="TRIAL">TRIAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <Button type="submit">Update</Button>
            </form>
            {company.owner && (
              <form action={resendCompanyWelcomeEmailAction}>
                <input type="hidden" name="id" value={company.id} />
                <Button type="submit" variant="outline">Resend welcome email</Button>
              </form>
            )}
            <form action={softDeleteCompanyAction}>
              <input type="hidden" name="id" value={company.id} />
              <Button type="submit" variant="destructive">
                <Trash2 className="size-4" />
                Soft Delete
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(company._count).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="text-sm capitalize text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
