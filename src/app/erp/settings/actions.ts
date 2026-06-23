"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

const settingsSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  registrationNo: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  address: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  invoiceLogoUrl: z.string().trim().optional(),
  invoiceFooter: z.string().trim().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  theme: z.enum(["light", "dark"]),
  defaultCurrency: z.string().length(3),
  defaultLanguage: z.string().min(2)
});

export async function updateCompanySettingsAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const parsed = settingsSchema.parse(Object.fromEntries(formData));
  const stableData = {
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    taxNumber: parsed.taxNumber || null,
    registrationNo: parsed.registrationNo || null,
    city: parsed.city || null,
    country: parsed.country || null,
    address: parsed.address || null,
    logoUrl: parsed.logoUrl || null,
    primaryColor: parsed.primaryColor,
    accentColor: parsed.accentColor,
    defaultCurrency: parsed.defaultCurrency,
    defaultLanguage: parsed.defaultLanguage
  };

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        ...stableData,
        invoiceLogoUrl: parsed.invoiceLogoUrl || null,
        invoiceFooter: parsed.invoiceFooter || null,
        theme: parsed.theme
      }
    });
  } catch (error) {
    console.error("[tenant-settings:update-extended-fields-failed]", error);
    await prisma.company.update({
      where: { id: companyId },
      data: stableData
    });
  }
  await audit("settings.update_company", "Company", companyId, { companyId, userId: session.user.id });
  revalidatePath("/erp/settings");
  revalidatePath("/dashboard");
}
