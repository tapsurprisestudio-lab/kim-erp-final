"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const planSchema = z.object({
  name: z.string().trim().min(2),
  monthlyPrice: z.coerce.number().nonnegative(),
  annualPrice: z.coerce.number().nonnegative(),
  currencyCode: z.string().length(3),
  maxUsers: z.coerce.number().int().positive(),
  maxProducts: z.coerce.number().int().positive(),
  features: z.string().trim().min(2)
});

export async function createPlanAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = planSchema.parse(Object.fromEntries(formData));
  const key = slugify(parsed.name);
  const features = parsed.features
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);

  const plan = await prisma.plan.upsert({
    where: { key },
    update: { ...parsed, features, active: true },
    create: { ...parsed, key, features, active: true }
  });

  await audit("plans.upsert", "Plan", plan.id, {
    userId: session.user.id,
    metadata: { key }
  });
  revalidatePath("/admin/plans");
}

export async function togglePlanAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await prisma.plan.update({ where: { id }, data: { active } });
  await audit("plans.toggle", "Plan", id, {
    userId: session.user.id,
    metadata: { active }
  });
  revalidatePath("/admin/plans");
}
