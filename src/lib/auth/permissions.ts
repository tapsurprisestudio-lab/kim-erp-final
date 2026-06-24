import { prisma } from "@/lib/prisma";

export const FULL_TENANT_PERMISSIONS = [
  "company.dashboard.read",
  "categories.manage",
  "units.manage",
  "products.manage",
  "warehouses.manage",
  "inventory.manage",
  "stock_movements.manage",
  "customers.manage",
  "suppliers.manage",
  "invoices.manage",
  "quotations.manage",
  "payments.manage",
  "expenses.manage",
  "purchases.read",
  "sales.read",
  "accounting.read",
  "employees.manage",
  "hr.read",
  "reports.read",
  "settings.manage",
  "audit.read",
  "notifications.read"
];

export function isCompanyOwnerLike({
  userId,
  companyOwnerId,
  roles
}: {
  userId?: string | null;
  companyOwnerId?: string | null;
  roles?: string[];
}) {
  const normalized = roles?.map((role) => role.toLowerCase()) ?? [];
  return Boolean(
    userId &&
    (companyOwnerId === userId ||
      normalized.includes("owner") ||
      normalized.includes("company_owner") ||
      normalized.includes("tenant_owner"))
  );
}

export async function ensureOwnerFullPermissions(companyId: string, ownerId: string) {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: FULL_TENANT_PERMISSIONS } },
    select: { id: true }
  });
  const role = await prisma.role.upsert({
    where: { scope_key: { scope: companyId, key: "owner" } },
    update: {
      companyId,
      name: "OWNER",
      system: true
    },
    create: {
      companyId,
      scope: companyId,
      key: "owner",
      name: "OWNER",
      system: true
    }
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true
    });
  }
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerId, roleId: role.id } },
    update: {},
    create: { userId: ownerId, roleId: role.id }
  });
  await prisma.user.update({
    where: { id: ownerId },
    data: { companyId, status: "ACTIVE", deletedAt: null }
  });
  await prisma.company.update({
    where: { id: companyId },
    data: { ownerId, status: "ACTIVE", deletedAt: null }
  });
  return role;
}
