"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["ACTIVE", "TRIAL", "SUSPENDED"]);

export async function updateCompanyStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.company.update({ where: { id }, data: { status } });
  await audit("companies.status_update", "Company", id, {
    userId: session.user.id,
    metadata: { status }
  });
  if (status === "SUSPENDED") {
    await securityLog("COMPANY_SUSPENDED", "Company suspended", { companyId: id, userId: session.user.id });
  }
  revalidatePath(`/admin/companies/${id}`);
  revalidatePath("/admin/companies");
}

export async function softDeleteCompanyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.company.update({
    where: { id },
    data: { status: "DELETED", deletedAt: new Date() }
  });
  await audit("companies.delete", "Company", id, { userId: session.user.id });
  await securityLog("COMPANY_DELETED", "Company soft deleted", { companyId: id, userId: session.user.id });
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}
