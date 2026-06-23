import type { Prisma, SecurityEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type LogContext = {
  companyId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function audit(action: string, entity: string, entityId: string | null, context: LogContext = {}) {
  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      companyId: context.companyId ?? null,
      userId: context.userId ?? null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
      metadata: context.metadata
    }
  });
}

export async function securityLog(type: SecurityEventType, message: string, context: LogContext = {}) {
  return prisma.securityLog.create({
    data: {
      type,
      message,
      companyId: context.companyId ?? null,
      userId: context.userId ?? null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
      metadata: context.metadata
    }
  });
}
