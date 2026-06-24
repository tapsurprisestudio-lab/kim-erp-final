"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/session";

export async function markAdminNotificationReadAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() }
  });
  revalidatePath("/admin/notifications");
}

export async function markAllAdminNotificationsReadAction() {
  const session = await requireSuperAdmin();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() }
  });
  revalidatePath("/admin/notifications");
}
