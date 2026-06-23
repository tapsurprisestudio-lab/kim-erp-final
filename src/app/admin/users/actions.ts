"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { slugify } from "@/lib/utils";

const statusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DELETED"]);

export async function createPlatformUserAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const email = z.string().email().parse(formData.get("email")).toLowerCase();
  const password = generateTemporaryPassword();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      username: slugify(email.split("@")[0]).replaceAll("-", "."),
      passwordHash: await hashPassword(password),
      forcePasswordReset: true,
      status: "INVITED"
    }
  });
  await audit("users.create_platform", "User", user.id, {
    userId: session.user.id,
    metadata: { email }
  });
  await securityLog("USER_CREATED", "Platform user created", { userId: session.user.id, metadata: { createdUserId: user.id } });
  revalidatePath("/admin/users");
}

export async function updateUserStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.user.update({
    where: { id },
    data: { status, deletedAt: status === "DELETED" ? new Date() : null }
  });
  await audit("users.status_update", "User", id, {
    userId: session.user.id,
    metadata: { status }
  });
  revalidatePath("/admin/users");
}
