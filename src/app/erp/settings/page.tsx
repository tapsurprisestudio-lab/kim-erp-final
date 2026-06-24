import Link from "next/link";
import { LockKeyhole, Settings } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DetailList } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateCompanySettingsAction } from "@/app/erp/settings/actions";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantSettingsPage() {
  const { session, companyId } = await requireTenant();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      taxNumber: true,
      registrationNo: true,
      city: true,
      country: true,
      address: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      theme: true,
      invoiceLogoUrl: true,
      invoiceFooter: true,
      defaultCurrency: true,
      defaultLanguage: true,
      status: true,
      industry: { select: { name: true } },
      owner: { select: { email: true } }
    }
  });

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <div className="space-y-6">
        <SectionHeader title="Settings" description="Tenant company profile, localization and fiscal defaults." icon={Settings} />
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-blue-950 md:flex-row md:items-center md:justify-between">
            <span>Use this page to change language, theme, logo, colors, currency and invoice footer. Changes are saved to the company profile and apply after reload.</span>
            <Button asChild variant="outline">
              <Link href="/erp/settings/users-permissions">
                <LockKeyhole className="size-4" />
                Users & Permissions
              </Link>
            </Button>
          </CardContent>
        </Card>
        {!company ? (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">Company settings could not be loaded. Contact support.</CardContent>
          </Card>
        ) : (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Company profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateCompanySettingsAction} className="grid gap-3 md:grid-cols-2">
                <Input name="name" defaultValue={company.name} placeholder="Company name" required />
                <Input name="email" type="email" defaultValue={company.email ?? ""} placeholder="Email" />
                <Input name="phone" defaultValue={company.phone ?? ""} placeholder="Phone" />
                <Input name="taxNumber" defaultValue={company.taxNumber ?? ""} placeholder="Tax number" />
                <Input name="registrationNo" defaultValue={company.registrationNo ?? ""} placeholder="Registration number" />
                <Input name="city" defaultValue={company.city ?? ""} placeholder="City" />
                <Input name="country" defaultValue={company.country ?? ""} placeholder="Country" />
                <Input name="address" defaultValue={company.address ?? ""} placeholder="Address" />
                <Input name="logoUrl" defaultValue={company.logoUrl ?? ""} placeholder="Company logo URL" />
                <Input name="invoiceLogoUrl" defaultValue={company.invoiceLogoUrl ?? ""} placeholder="Invoice logo URL" />
                <Input name="invoiceFooter" defaultValue={company.invoiceFooter ?? ""} placeholder="Invoice footer text" />
                <Input name="primaryColor" type="color" defaultValue={company.primaryColor} required />
                <Input name="accentColor" type="color" defaultValue={company.accentColor} required />
                <select name="theme" defaultValue={company.theme} className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <Input name="defaultCurrency" defaultValue={company.defaultCurrency} maxLength={3} required />
                <Input name="defaultLanguage" defaultValue={company.defaultLanguage} required />
                <Button type="submit" className="md:col-span-2">Save Settings</Button>
              </form>
            </CardContent>
          </Card>
          <DetailList
            items={[
              { label: "Tenant ID", value: company.id.slice(0, 10) },
              { label: "Status", value: company.status },
              { label: "Industry", value: company.industry?.name ?? "-" },
              { label: "Owner", value: company.owner?.email ?? "-" },
              { label: "Default currency", value: company.defaultCurrency },
              { label: "Default language", value: company.defaultLanguage },
              { label: "Theme", value: company.theme }
            ]}
          />
        </div>
        )}
      </div>
    </AppShell>
  );
}
