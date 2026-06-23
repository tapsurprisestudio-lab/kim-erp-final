"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const unitSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1).max(12).transform((value) => value.toUpperCase())
});

export async function saveUnitAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("units.manage");
  const parsed = unitSchema.parse(Object.fromEntries(formData));
  const unit = parsed.id
    ? await prisma.unit.update({
        where: { id: parsed.id },
        data: { name: parsed.name, code: parsed.code, active: true, deletedAt: null }
      })
    : await prisma.unit.upsert({
        where: { companyId_code: { companyId, code: parsed.code } },
        update: { name: parsed.name, active: true, deletedAt: null },
        create: { companyId, name: parsed.name, code: parsed.code }
      });

  await audit("units.save", "Unit", unit.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/units");
}

export async function deleteUnitAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("units.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.unit.updateMany({ where: { id, companyId }, data: { active: false, deletedAt: new Date() } });
  await audit("units.delete", "Unit", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/units");
}
