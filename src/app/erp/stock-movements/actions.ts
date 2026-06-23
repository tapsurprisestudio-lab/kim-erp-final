"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const movementSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  type: z.enum(["ADJUSTMENT", "PURCHASE", "SALE", "TRANSFER", "RETURN"]),
  quantity: z.coerce.number(),
  reference: z.string().optional(),
  note: z.string().optional()
});

function signedQuantity(type: string, quantity: number) {
  if (type === "SALE" || type === "TRANSFER") {
    return -Math.abs(quantity);
  }
  if (type === "ADJUSTMENT") {
    return quantity;
  }
  return Math.abs(quantity);
}

export async function createStockMovementAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("stock_movements.manage");
  const parsed = movementSchema.parse(Object.fromEntries(formData));
  const [product, warehouse] = await Promise.all([
    prisma.product.findFirstOrThrow({ where: { id: parsed.productId, companyId, deletedAt: null } }),
    prisma.warehouse.findFirstOrThrow({ where: { id: parsed.warehouseId, companyId, deletedAt: null } })
  ]);
  const delta = signedQuantity(parsed.type, parsed.quantity);

  const movement = await prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        companyId,
        productId: product.id,
        warehouseId: warehouse.id,
        type: parsed.type,
        quantity: parsed.quantity,
        reference: parsed.reference || null,
        note: parsed.note || null
      }
    });
    await tx.inventoryItem.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
      update: { quantity: { increment: delta } },
      create: { productId: product.id, warehouseId: warehouse.id, quantity: delta, reorderPoint: 0 }
    });
    return movement;
  });

  await audit("stock_movements.create", "StockMovement", movement.id, { companyId, userId: session.user.id });
  await securityLog("INVENTORY_UPDATED", "Stock movement changed inventory", {
    companyId,
    userId: session.user.id,
    metadata: { movementId: movement.id, delta }
  });
  revalidatePath("/erp/stock-movements");
  revalidatePath("/erp/inventory");
}

export async function deleteStockMovementAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("stock_movements.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.stockMovement.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  await audit("stock_movements.delete", "StockMovement", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/stock-movements");
}
