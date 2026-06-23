"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

const expenseSchema = z.object({
  supplierId: z.string().optional(),
  category: z.string().trim().min(2),
  description: z.string().trim().optional(),
  amount: z.coerce.number().positive(),
  currencyCode: z.string().length(3),
  expenseDate: z.coerce.date()
});

export async function createExpenseAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const parsed = expenseSchema.parse(Object.fromEntries(formData));
  const supplierId = parsed.supplierId || null;
  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId, deletedAt: null } });
    if (!supplier) {
      throw new Error("Supplier not found for this tenant.");
    }
  }
  const expense = await prisma.expense.create({
    data: {
      companyId,
      supplierId,
      category: parsed.category,
      description: parsed.description || null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      expenseDate: parsed.expenseDate
    }
  });
  await audit("expenses.create", "Expense", expense.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.expense.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  await audit("expenses.delete", "Expense", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/expenses");
}
