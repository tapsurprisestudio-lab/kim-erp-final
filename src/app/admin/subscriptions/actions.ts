"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]);

export async function updateSubscriptionStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.subscription.update({
    where: { id },
    data: {
      status,
      cancelledAt: status === "CANCELLED" ? new Date() : null
    }
  });
  await audit("subscriptions.status_update", "Subscription", id, {
    userId: session.user.id,
    metadata: { status }
  });
  revalidatePath("/admin/subscriptions");
}

export async function renewSubscriptionAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const months = z.coerce.number().int().positive().default(1).parse(formData.get("months") ?? "1");
  const current = await prisma.subscription.findUniqueOrThrow({ where: { id } });
  const base = current.endsAt > new Date() ? current.endsAt : new Date();
  const endsAt = new Date(base);
  endsAt.setMonth(endsAt.getMonth() + months);
  await prisma.subscription.update({
    where: { id },
    data: {
      status: "ACTIVE",
      renewedAt: new Date(),
      endsAt
    }
  });
  await audit("subscriptions.renew", "Subscription", id, {
    userId: session.user.id,
    metadata: { months }
  });
  revalidatePath("/admin/subscriptions");
}
