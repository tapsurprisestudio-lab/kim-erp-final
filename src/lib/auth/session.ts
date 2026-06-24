import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });
  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    redirect("/account-disabled");
  }
  if (user.companyId && (!user.company || user.company.deletedAt || user.company.status === "DELETED")) {
    redirect("/company-suspended?reason=deleted");
  }
  if (user.companyId && user.company?.status !== "ACTIVE") {
    redirect("/company-suspended");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.user.roles.includes("super_admin") && !session.user.roles.includes("platform_admin")) {
    redirect("/dashboard");
  }
  return session;
}
