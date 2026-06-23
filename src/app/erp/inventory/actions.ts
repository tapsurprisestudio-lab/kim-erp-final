"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const inventorySchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.coerce.number(),
  reorderPoint: z.coerce.number().nonnegative().default(0)
});

export async function upsertInventoryAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("inventory.manage");
  const parsed = inventorySchema.parse(Object.fromEntries(formData));
  const [product, warehouse] = await Promise.all([
    prisma.product.findFirstOrThrow({ where: { id: parsed.productId, companyId, deletedAt: null } }),
    prisma.warehouse.findFirstOrThrow({ where: { id: parsed.warehouseId, companyId, deletedAt: null } })
  ]);
  const item = await prisma.inventoryItem.upsert({
    where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    update: { quantity: parsed.quantity, reorderPoint: parsed.reorderPoint, deletedAt: null },
    create: {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: parsed.quantity,
      reorderPoint: parsed.reorderPoint
    }
  });
  await audit("inventory.upsert", "InventoryItem", item.id, { companyId, userId: session.user.id });
  await securityLog("INVENTORY_UPDATED", "Inventory quantity updated", { companyId, userId: session.user.id, metadata: parsed });
  revalidatePath("/erp/inventory");
}

export async function deleteInventoryAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("inventory.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const item = await prisma.inventoryItem.findFirstOrThrow({
    where: { id, product: { companyId } },
    include: { product: true }
  });
  await prisma.inventoryItem.update({ where: { id: item.id }, data: { deletedAt: new Date() } });
  await audit("inventory.delete", "InventoryItem", id, { companyId, userId: session.user.id });
  await securityLog("INVENTORY_UPDATED", "Inventory item deleted", { companyId, userId: session.user.id, metadata: { id } });
  revalidatePath("/erp/inventory");
}
