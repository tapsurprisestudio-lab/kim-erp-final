"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { sendMail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { requireTenantPermission } from "@/lib/tenant";
import { slugify } from "@/lib/utils";

const employeeSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  roleId: z.string().min(1)
});

const statusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DELETED"]);

async function nextUsername(base: string) {
  const clean = slugify(base).replaceAll("-", ".") || "user";
  const existing = await prisma.user.findMany({ where: { username: { startsWith: clean } }, select: { username: true } });
  if (!existing.some((user) => user.username === clean)) {
    return clean;
  }
  return `${clean}.${existing.length + 1}`;
}

async function createActivationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }
  });
  return token;
}

export async function inviteEmployeeAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("employees.manage");
  const parsed = employeeSchema.parse(Object.fromEntries(formData));
  const role = await prisma.role.findFirst({ where: { id: parsed.roleId, companyId } });
  if (!role) {
    throw new Error("Role not found for this tenant.");
  }
  const password = generateTemporaryPassword();
  const user = await prisma.user.create({
    data: {
      companyId,
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      username: await nextUsername(parsed.email.split("@")[0]),
      passwordHash: await hashPassword(password),
      forcePasswordReset: true,
      status: "INVITED"
    }
  });
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  const token = await createActivationToken(user.email);
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await sendMail({
    to: user.email,
    subject: "You are invited to KIM-ERB",
    text: [
      `Hello ${user.name},`,
      "",
      `${session.user.companyName ?? "Your company"} invited you to KIM-ERB.`,
      `Username: ${user.username}`,
      `Temporary password: ${password}`,
      `Activation link: ${appUrl}/activate?email=${encodeURIComponent(user.email)}&token=${token}`,
      "",
      "Activate your account before signing in."
    ].join("\n")
  });
  await audit("employees.invite", "User", user.id, { companyId, userId: session.user.id, metadata: { roleId: role.id } });
  await securityLog("USER_CREATED", "Tenant employee invited", { companyId, userId: session.user.id, metadata: { invitedUserId: user.id } });
  revalidatePath("/erp/employees");
}

export async function updateEmployeeStatusAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("employees.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.user.updateMany({ where: { id, companyId }, data: { status, deletedAt: status === "DELETED" ? new Date() : null } });
  await audit("employees.status", "User", id, { companyId, userId: session.user.id, metadata: { status } });
  revalidatePath("/erp/employees");
}

export async function resetEmployeePasswordAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("employees.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const password = generateTemporaryPassword();
  const user = await prisma.user.findFirstOrThrow({ where: { id, companyId } });
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password), forcePasswordReset: true, status: "ACTIVE" } });
  await sendMail({
    to: user.email,
    subject: "KIM-ERB password reset",
    text: [`Hello ${user.name},`, "", `Your temporary password is: ${password}`, "Please sign in and change it immediately."].join("\n")
  });
  await audit("employees.reset_password", "User", id, { companyId, userId: session.user.id });
  revalidatePath("/erp/employees");
}
