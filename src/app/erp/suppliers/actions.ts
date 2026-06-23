"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

const supplierSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  address: z.string().trim().optional()
});

export async function createSupplierAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const parsed = supplierSchema.parse(Object.fromEntries(formData));
  const supplier = await prisma.supplier.create({
    data: {
      companyId,
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      taxNumber: parsed.taxNumber || null,
      address: parsed.address || null
    }
  });
  await audit("suppliers.create", "Supplier", supplier.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/suppliers");
}

export async function deleteSupplierAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.supplier.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  await audit("suppliers.delete", "Supplier", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/suppliers");
}
