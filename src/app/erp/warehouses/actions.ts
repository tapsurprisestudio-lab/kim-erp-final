"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const warehouseSchema = z.object({
  code: z.string().trim().min(1).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2),
  address: z.string().optional()
});

export async function createWarehouseAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("warehouses.manage");
  const parsed = warehouseSchema.parse(Object.fromEntries(formData));
  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_code: { companyId, code: parsed.code } },
    update: { name: parsed.name, address: parsed.address || null, active: true, deletedAt: null },
    create: { companyId, ...parsed }
  });
  await audit("warehouses.upsert", "Warehouse", warehouse.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/warehouses");
}

export async function toggleWarehouseAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("warehouses.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await prisma.warehouse.updateMany({ where: { id, companyId }, data: { active } });
  await audit("warehouses.toggle", "Warehouse", id, { companyId, userId: session.user.id, metadata: { active } });
  revalidatePath("/erp/warehouses");
}

export async function updateWarehouseAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("warehouses.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = warehouseSchema.parse(Object.fromEntries(formData));
  await prisma.warehouse.updateMany({
    where: { id, companyId },
    data: { ...parsed, address: parsed.address || null }
  });
  await audit("warehouses.update", "Warehouse", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/warehouses");
}

export async function deleteWarehouseAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("warehouses.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.warehouse.updateMany({ where: { id, companyId }, data: { active: false, deletedAt: new Date() } });
  await audit("warehouses.delete", "Warehouse", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/warehouses");
}
