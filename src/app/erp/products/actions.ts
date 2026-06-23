"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(2),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().optional(),
  cost: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().nonnegative().default(0)
});

async function nextProductSku(companyId: string, name: string) {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6) || "PROD";
  const count = await prisma.product.count({ where: { companyId } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function normalizeProductInput(companyId: string, formData: FormData) {
  const parsed = productSchema.parse(Object.fromEntries(formData));
  return {
    sku: parsed.sku || await nextProductSku(companyId, parsed.name),
    name: parsed.name,
    categoryId: parsed.categoryId || null,
    description: parsed.description || null,
    unit: parsed.unit || "pcs",
    price: parsed.price ?? 0,
    cost: parsed.cost ?? 0,
    taxRate: parsed.taxRate ?? 0
  };
}

export async function createProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const parsed = await normalizeProductInput(companyId, formData);
  const product = await prisma.product.upsert({
    where: { companyId_sku: { companyId, sku: parsed.sku } },
    update: { ...parsed, active: true, deletedAt: null },
    create: { ...parsed, companyId }
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
  const parsed = await normalizeProductInput(companyId, formData);
  await prisma.product.updateMany({
    where: { id, companyId },
    data: parsed
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
