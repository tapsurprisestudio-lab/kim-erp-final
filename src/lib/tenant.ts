import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { FULL_TENANT_PERMISSIONS, isCompanyOwnerLike } from "@/lib/auth/permissions";

export async function requireTenant() {
  const session = await requireSession();
  if (!session.user.companyId) {
    notFound();
  }
  return {
    session,
    companyId: session.user.companyId
  };
}

export async function requireTenantPermission(permission: string) {
  const tenant = await requireTenant();
  const company = await prisma.company.findUnique({
    where: { id: tenant.companyId },
    select: { ownerId: true, status: true, deletedAt: true }
  });
  if (!company || company.deletedAt || company.status === "DELETED") {
    redirect("/company-suspended?reason=deleted");
  }
  if (company.status !== "ACTIVE") {
    redirect("/company-suspended");
  }
  const ownerLike = isCompanyOwnerLike({
    userId: tenant.session.user.id,
    companyOwnerId: company.ownerId,
    roles: tenant.session.user.roles
  });
  if (ownerLike) {
    tenant.session.user.permissions = Array.from(new Set([...(tenant.session.user.permissions ?? []), ...FULL_TENANT_PERMISSIONS]));
    return tenant;
  }
  if (!hasPermission(tenant.session.user.permissions, permission)) {
    redirect("/access-denied");
  }
  return tenant;
}

export function tenantWhere(companyId: string) {
  return {
    companyId,
    deletedAt: null
  };
}

export async function assertCompanyAccess(companyId: string) {
  const session = await requireSession();
  if (session.user.roles.includes("super_admin")) {
    return session;
  }
  if (session.user.companyId !== companyId) {
    notFound();
  }
  return session;
}

export async function getTenantCompany(companyId: string) {
  await assertCompanyAccess(companyId);
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      deletedAt: null
    }
  });
  if (!company) {
    notFound();
  }
  return company;
}
