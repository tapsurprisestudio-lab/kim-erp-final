"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const productSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(2),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().trim().min(1).default("pcs"),
  price: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().nonnegative().default(0)
});

export async function createProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const parsed = productSchema.parse(Object.fromEntries(formData));
  const product = await prisma.product.upsert({
    where: { companyId_sku: { companyId, sku: parsed.sku } },
    update: { ...parsed, categoryId: parsed.categoryId || null, active: true, deletedAt: null },
    create: { ...parsed, companyId, categoryId: parsed.categoryId || null }
  });
  await audit("products.upsert", "Product", product.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/products");
}

export async function toggleProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await prisma.product.updateMany({ where: { id, companyId }, data: { active } });
  await audit("products.toggle", "Product", id, { companyId, userId: session.user.id, metadata: { active } });
  revalidatePath("/erp/products");
}

export async function updateProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = productSchema.parse(Object.fromEntries(formData));
  await prisma.product.updateMany({
    where: { id, companyId },
    data: { ...parsed, categoryId: parsed.categoryId || null }
  });
  await audit("products.update", "Product", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/products");
}

export async function deleteProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.product.updateMany({ where: { id, companyId }, data: { active: false, deletedAt: new Date() } });
  await audit("products.delete", "Product", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/products");
}
