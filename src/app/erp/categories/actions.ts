"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireTenantPermission } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function createCategoryAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("categories.manage");
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const category = await prisma.category.upsert({
    where: { companyId_slug: { companyId, slug: slugify(name) } },
    update: { name, deletedAt: null },
    create: { companyId, name, slug: slugify(name) }
  });
  await audit("categories.upsert", "Category", category.id, { companyId, userId: session.user.id });
  revalidatePath("/erp/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("categories.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.category.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  await audit("categories.delete", "Category", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/categories");
}

export async function updateCategoryAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("categories.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const name = z.string().trim().min(2).parse(formData.get("name"));
  await prisma.category.updateMany({
    where: { id, companyId },
    data: { name, slug: slugify(name) }
  });
  await audit("categories.update", "Category", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/categories");
}
