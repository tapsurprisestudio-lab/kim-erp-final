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

export async function notifyPlatformAdmins({
  title,
  body,
  type = "info",
  priority = "info",
  actionLink
}: {
  title: string;
  body: string;
  type?: string;
  priority?: string;
  actionLink?: string | null;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        roles: {
          some: {
            role: {
              key: { in: ["super_admin", "platform_admin"] },
              scope: "platform"
            }
          }
        }
      },
      select: { id: true }
    });
    if (admins.length === 0) {
      return [];
    }
    return await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        companyId: null,
        title,
        body,
        type,
        priority,
        actionLink: actionLink ?? null
      }))
    });
  } catch (error) {
    console.error("[notification:platform-admins-failed]", { title, error });
    return null;
  }
}
