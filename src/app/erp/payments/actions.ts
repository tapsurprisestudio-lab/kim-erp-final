"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const paymentSchema = z.object({
  invoiceId: z.string().optional(),
  amount: z.coerce.number().positive(),
  currencyCode: z.string().length(3),
  method: z.string().trim().min(2),
  reference: z.string().trim().optional()
});

export async function createPaymentAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("payments.manage");
  const parsed = paymentSchema.parse(Object.fromEntries(formData));
  const invoiceId = parsed.invoiceId || null;
  if (invoiceId) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId, deletedAt: null } });
    if (!invoice) {
      throw new Error("Invoice not found for this tenant.");
    }
  }
  const payment = await prisma.payment.create({
    data: {
      companyId,
      invoiceId,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      method: parsed.method,
      reference: parsed.reference || null
    }
  });
  await audit("payments.create", "Payment", payment.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/payments");
}
