"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const productSchema = z.object({
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  name: z.string().trim().min(1),
  categoryId: z.string().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  description: z.string().optional(),
  imageUrl: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().optional(),
  cost: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().nonnegative().default(0),
  expiryDate: z.string().optional(),
  serialNumber: z.string().trim().optional(),
  imei: z.string().trim().optional(),
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  specs: z.string().trim().optional(),
  stockQuantity: z.coerce.number().nonnegative().optional(),
  warehouseId: z.string().optional()
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
    barcode: parsed.barcode || null,
    name: parsed.name,
    categoryId: parsed.categoryId || null,
    brand: parsed.brand || null,
    model: parsed.model || null,
    description: parsed.description || null,
    imageUrl: parsed.imageUrl || null,
    unit: parsed.unit || "pcs",
    price: parsed.price ?? 0,
    cost: parsed.cost ?? 0,
    taxRate: parsed.taxRate ?? 0,
    expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
    serialNumber: parsed.serialNumber || null,
    imei: parsed.imei || null,
    color: parsed.color || null,
    size: parsed.size || null,
    specs: parsed.specs ? { text: parsed.specs } : undefined,
    stockQuantity: parsed.stockQuantity ?? 0,
    warehouseId: parsed.warehouseId || null
  };
}

export async function createProductAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const parsed = await normalizeProductInput(companyId, formData);
  const product = await prisma.product.upsert({
    where: { companyId_sku: { companyId, sku: parsed.sku } },
    update: {
      sku: parsed.sku,
      barcode: parsed.barcode,
      name: parsed.name,
      categoryId: parsed.categoryId,
      brand: parsed.brand,
      model: parsed.model,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      unit: parsed.unit,
      price: parsed.price,
      cost: parsed.cost,
      taxRate: parsed.taxRate,
      expiryDate: parsed.expiryDate,
      serialNumber: parsed.serialNumber,
      imei: parsed.imei,
      color: parsed.color,
      size: parsed.size,
      specs: parsed.specs,
      active: true,
      deletedAt: null
    },
    create: {
      companyId,
      sku: parsed.sku,
      barcode: parsed.barcode,
      name: parsed.name,
      categoryId: parsed.categoryId,
      brand: parsed.brand,
      model: parsed.model,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      unit: parsed.unit,
      price: parsed.price,
      cost: parsed.cost,
      taxRate: parsed.taxRate,
      expiryDate: parsed.expiryDate,
      serialNumber: parsed.serialNumber,
      imei: parsed.imei,
      color: parsed.color,
      size: parsed.size,
      specs: parsed.specs
    }
  });
  if (parsed.warehouseId && parsed.stockQuantity > 0) {
    await prisma.inventoryItem.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: parsed.warehouseId } },
      update: { quantity: parsed.stockQuantity, deletedAt: null },
      create: { productId: product.id, warehouseId: parsed.warehouseId, quantity: parsed.stockQuantity }
    });
  }
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
    data: {
      sku: parsed.sku,
      barcode: parsed.barcode,
      name: parsed.name,
      categoryId: parsed.categoryId,
      brand: parsed.brand,
      model: parsed.model,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      unit: parsed.unit,
      price: parsed.price,
      cost: parsed.cost,
      taxRate: parsed.taxRate,
      expiryDate: parsed.expiryDate,
      serialNumber: parsed.serialNumber,
      imei: parsed.imei,
      color: parsed.color,
      size: parsed.size,
      specs: parsed.specs
    }
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
