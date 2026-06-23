"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function createPlatformRoleAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const description = z.string().trim().optional().parse(formData.get("description") || undefined);
  const permissions = formData.getAll("permissions").map(String);
  const role = await prisma.role.upsert({
    where: { scope_key: { scope: "platform", key: slugify(name) } },
    update: { name, description },
    create: { scope: "platform", key: slugify(name), name, description }
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  if (permissions.length > 0) {
    const existingPermissions = await prisma.permission.findMany({ where: { key: { in: permissions } } });
    await prisma.rolePermission.createMany({
      data: existingPermissions.map((permission) => ({ roleId: role.id, permissionId: permission.id }))
    });
  }

  await audit("roles.upsert", "Role", role.id, {
    userId: session.user.id,
    metadata: { permissions }
  });
  await securityLog("ROLE_CHANGED", "Platform role changed", { userId: session.user.id, metadata: { roleId: role.id } });
  revalidatePath("/admin/roles");
}
