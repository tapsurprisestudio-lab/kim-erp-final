"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

const customerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  address: z.string().trim().optional()
});

export async function createCustomerAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const parsed = customerSchema.parse(Object.fromEntries(formData));
  const customer = await prisma.customer.create({
    data: {
      companyId,
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      taxNumber: parsed.taxNumber || null,
      city: parsed.city || null,
      country: parsed.country || null,
      address: parsed.address || null
    }
  });
  await audit("customers.create", "Customer", customer.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/customers");
}

export async function deleteCustomerAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.customer.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  await audit("customers.delete", "Customer", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/customers");
}
