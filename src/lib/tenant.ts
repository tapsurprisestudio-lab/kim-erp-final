import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";

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
  if (!hasPermission(tenant.session.user.permissions, permission)) {
    redirect("/dashboard?error=permission-denied");
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
