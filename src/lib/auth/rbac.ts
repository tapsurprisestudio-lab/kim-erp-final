import { requireSession } from "@/lib/auth/session";

export function hasPermission(userPermissions: string[] | undefined, permission: string) {
  return Boolean(userPermissions?.includes(permission));
}

export async function requirePermission(permission: string) {
  const session = await requireSession();
  if (!hasPermission(session.user.permissions, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
  return session;
}

export function canAccessCompany(sessionCompanyId: string | null | undefined, targetCompanyId: string) {
  return Boolean(sessionCompanyId && sessionCompanyId === targetCompanyId);
}
