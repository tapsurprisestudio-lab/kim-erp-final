import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getCurrentSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.user.roles.includes("super_admin")) {
    redirect("/dashboard");
  }
  return session;
}
