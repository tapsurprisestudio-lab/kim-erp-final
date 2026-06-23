"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function createIndustryAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const slug = slugify(name);
  await prisma.industry.upsert({
    where: { slug },
    update: { name, active: true },
    create: { name, slug }
  });
  await audit("industries.upsert", "Industry", slug, { userId: session.user.id });
  revalidatePath("/admin/industries");
}

export async function toggleIndustryAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await prisma.industry.update({ where: { id }, data: { active } });
  await audit("industries.toggle", "Industry", id, {
    userId: session.user.id,
    metadata: { active }
  });
  revalidatePath("/admin/industries");
}
