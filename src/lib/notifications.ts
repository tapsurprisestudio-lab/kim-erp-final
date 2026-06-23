import { prisma } from "@/lib/prisma";

export async function createNotification({
  companyId,
  userId,
  title,
  body,
  type = "info",
  priority = "info",
  actionLink,
  expiresAt
}: {
  companyId?: string | null;
  userId?: string | null;
  title: string;
  body: string;
  type?: string;
  priority?: string;
  actionLink?: string | null;
  expiresAt?: Date | null;
}) {
  try {
    return await prisma.notification.create({
      data: {
        companyId: companyId ?? null,
        userId: userId ?? null,
        title,
        body,
        type,
        priority,
        actionLink: actionLink ?? null,
        expiresAt: expiresAt ?? null
      }
    });
  } catch (error) {
    console.error("[notification:create-failed]", { companyId, userId, title, error });
    return null;
  }
}
