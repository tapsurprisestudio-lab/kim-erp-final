"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const billingSchema = z.object({
  subscriptionId: z.string().min(1),
  number: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative(),
  currencyCode: z.string().length(3),
  dueDate: z.string().min(1)
});

export async function createBillingRecordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = billingSchema.parse(Object.fromEntries(formData));
  const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: parsed.subscriptionId } });
  const record = await prisma.billingRecord.create({
    data: {
      companyId: subscription.companyId,
      subscriptionId: subscription.id,
      number: parsed.number,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      dueDate: new Date(parsed.dueDate)
    }
  });
  await audit("billing.create", "BillingRecord", record.id, { userId: session.user.id, companyId: subscription.companyId });
  revalidatePath("/admin/billing");
}

export async function updateBillingStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = z.enum(["OPEN", "PAID", "VOID", "OVERDUE"]).parse(formData.get("status"));
  const record = await prisma.billingRecord.update({
    where: { id },
    data: { status, paidAt: status === "PAID" ? new Date() : null }
  });
  await audit("billing.status_update", "BillingRecord", id, { userId: session.user.id, companyId: record.companyId, metadata: { status } });
  revalidatePath("/admin/billing");
}

export async function deleteBillingRecordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const record = await prisma.billingRecord.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit("billing.delete", "BillingRecord", id, { userId: session.user.id, companyId: record.companyId });
  revalidatePath("/admin/billing");
}
