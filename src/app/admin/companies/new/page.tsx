import { ArrowLeft, Building2, CheckCircle2, Palette, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createCompanyAction } from "@/app/admin/companies/new/actions";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSuperAdmin();
  const query = await searchParams;
  const [industries, plans, currencies, languages] = await Promise.all([
    prisma.industry.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { monthlyPrice: "asc" } }),
    prisma.currency.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { code: "asc" }], take: 40 }),
    prisma.language.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { code: "asc" }] })
  ]);

  return (
    <AppShell userName={session.user.name} scope="platform">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="size-4" />
            Companies
          </Link>
        </Button>
      </div>
      <Card className="max-w-5xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <CardTitle>Add New Company</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Creates the tenant, active owner login, subscription, logs, logo asset, and welcome contract.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {query.error}
            </div>
          )}
          <form action={createCompanyAction} className="grid gap-6 lg:grid-cols-[240px_1fr]" encType="multipart/form-data">
            <div className="space-y-3">
              {[
                [Building2, "Company", "Identity and registration"],
                [UserRound, "Owner", "Login credentials"],
                [Palette, "Branding", "Logo and colors"],
                [ShieldCheck, "Subscription", "Plan and defaults"],
                [CheckCircle2, "Confirm", "Contract and email"]
              ].map(([Icon, title, description], index) => {
                const StepIcon = Icon as typeof Building2;
                return (
                  <div key={String(title)} className="flex gap-3 rounded-xl border bg-white p-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary">
                      <StepIcon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {index + 1}. {String(title)}
                      </div>
                      <div className="text-xs text-slate-500">{String(description)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Company name</span>
                  <Input name="companyName" required placeholder="Ziad Electronics" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Industry</span>
                  <select name="industryId" required className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Commercial registration</span>
                  <Input name="registrationNo" placeholder="CR-2026-000122" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Tax number</span>
                  <Input name="taxNumber" placeholder="TX-556077889" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Company email</span>
                  <Input name="companyEmail" type="email" placeholder="info@company.com" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Phone</span>
                  <Input name="phone" placeholder="+218..." />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Country</span>
                  <Input name="country" placeholder="Libya" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>City</span>
                  <Input name="city" placeholder="Tripoli" />
                </label>
              </section>
              <section className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Owner name</span>
                  <Input name="ownerName" required placeholder="Ziad Alsayed" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Owner email</span>
                  <Input name="ownerEmail" type="email" required placeholder="owner@company.com" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Username</span>
                  <Input name="username" required placeholder="ziad.owner" autoComplete="username" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Password</span>
                  <Input name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" autoComplete="new-password" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Confirm password</span>
                  <Input name="confirmPassword" type="password" required minLength={8} placeholder="Repeat password" autoComplete="new-password" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Logo upload</span>
                  <Input name="logo" type="file" accept="image/*" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Primary color</span>
                  <Input name="primaryColor" type="color" defaultValue="#2563EB" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Accent color</span>
                  <Input name="accentColor" type="color" defaultValue="#8B5CF6" />
                </label>
              </section>
              <section className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Subscription plan</span>
                  <select name="planId" required className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Default currency</span>
                  <select name="defaultCurrency" defaultValue="LYD" required className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Default language</span>
                  <select name="defaultLanguage" defaultValue="ar" required className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name} ({language.direction})
                      </option>
                    ))}
                  </select>
                </label>
              </section>
              <div className="flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin/companies">Cancel</Link>
              </Button>
              <Button type="submit">Create Company</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
