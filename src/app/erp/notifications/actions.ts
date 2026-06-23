"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export async function markNotificationReadAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.notification.updateMany({
    where: {
      id,
      OR: [{ userId: session.user.id }, { companyId }]
    },
    data: { readAt: new Date() }
  });
  revalidatePath("/erp/notifications");
}

export async function markAllTenantNotificationsReadAction() {
  const { session, companyId } = await requireTenant();
  await prisma.notification.updateMany({
    where: {
      readAt: null,
      OR: [{ userId: session.user.id }, { companyId }]
    },
    data: { readAt: new Date() }
  });
  revalidatePath("/erp/notifications");
  revalidatePath("/dashboard");
}
