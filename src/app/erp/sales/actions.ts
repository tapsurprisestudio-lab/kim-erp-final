"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.string().trim().optional(),
  paidAmount: z.coerce.number().nonnegative().default(0)
});

function lineItemsFromForm(formData: FormData) {
  return [0, 1, 2]
    .map((index) => ({
      productId: String(formData.get(`items.${index}.productId`) ?? ""),
      quantity: Number(formData.get(`items.${index}.quantity`) ?? 0),
      price: Number(formData.get(`items.${index}.price`) ?? 0),
      discount: Number(formData.get(`items.${index}.discount`) ?? 0),
      taxRate: Number(formData.get(`items.${index}.taxRate`) ?? 0)
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

async function nextInvoiceNumber(companyId: string) {
  const count = await prisma.invoice.count({ where: { companyId } });
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
}

export async function createSaleAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("sales.read");
  const parsed = saleSchema.parse(Object.fromEntries(formData));
  const items = lineItemsFromForm(formData);
  if (items.length === 0) {
    throw new Error("Add at least one product to the sale.");
  }

  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } });
  const products = await prisma.product.findMany({
    where: { companyId, id: { in: items.map((item) => item.productId) }, deletedAt: null },
    select: { id: true, name: true, price: true, taxRate: true }
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalized = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("One or more products were not found in this company.");
    }
    const unitPrice = item.price || Number(product.price);
    const taxRate = item.taxRate || Number(product.taxRate);
    const subtotal = item.quantity * unitPrice - item.discount;
    const tax = subtotal * (taxRate / 100);
    return {
      product,
      quantity: item.quantity,
      unitPrice,
      discount: item.discount,
      taxRate,
      lineSubtotal: subtotal,
      lineTax: tax,
      total: subtotal + tax
    };
  });

  const subtotal = normalized.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const taxTotal = normalized.reduce((sum, item) => sum + item.lineTax, 0);
  const total = subtotal + taxTotal;
  const paidAmount = Math.min(parsed.paidAmount, total);

  const invoice = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        companyId,
        customerId: parsed.customerId || null,
        number: await nextInvoiceNumber(companyId),
        status: paidAmount >= total ? "PAID" : paidAmount > 0 ? "PARTIAL" : "SENT",
        currencyCode: company?.defaultCurrency ?? "USD",
        subtotal,
        taxTotal,
        total,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        qrPayload: `KIM-ERB|${companyId}|${total.toFixed(2)}`
      }
    });

    for (const item of normalized) {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.product.id,
          description: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          total: item.total
        }
      });

      const stock = await tx.inventoryItem.findFirst({
        where: { productId: item.product.id, deletedAt: null },
        orderBy: { updatedAt: "desc" }
      });
      if (stock) {
        await tx.inventoryItem.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } }
        });
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.product.id,
            warehouseId: stock.warehouseId,
            type: "SALE",
            quantity: item.quantity,
            reference: invoice.number,
            note: "Created from sales form"
          }
        });
      }
    }

    if (paidAmount > 0) {
      await tx.payment.create({
        data: {
          companyId,
          invoiceId: invoice.id,
          amount: paidAmount,
          currencyCode: company?.defaultCurrency ?? "USD",
          method: parsed.paymentMethod || "Cash",
          reference: invoice.number
        }
      });
    }

    return invoice;
  });

  await audit("sales.create", "Invoice", invoice.id, { companyId, userId: session.user.id, metadata: { total, paidAmount } });
  await createNotification({
    companyId,
    userId: session.user.id,
    title: "Sale created",
    body: `${invoice.number} total ${total.toFixed(2)}`,
    type: "sale_created",
    priority: paidAmount < total ? "warning" : "info",
    actionLink: "/erp/sales"
  });
  revalidatePath("/erp/sales");
  revalidatePath("/erp/invoices");
  revalidatePath("/erp/inventory");
}
