"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { sendMail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";

const statusSchema = z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DELETED"]);
const userSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  username: z.string().trim().min(2).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match."
});

const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  username: z.string().trim().min(2).regex(/^[a-zA-Z0-9._-]+$/)
});

const passwordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match."
});

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

export async function createPlatformUserAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = userSchema.parse(Object.fromEntries(formData));
  const email = parsed.email.toLowerCase();
  const username = parsed.username.toLowerCase();
  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } })
  ]);
  if (existingEmail) {
    throw new Error("Email is already in use.");
  }
  if (existingUsername) {
    throw new Error("Username is already in use.");
  }
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email,
      username,
      passwordHash: await hashPassword(parsed.password),
      forcePasswordReset: false,
      status: "ACTIVE",
      emailVerified: new Date()
    }
  });
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await sendMail({
    to: user.email,
    subject: "Welcome to KIM-ERB Platform",
    text: [
      `Hello ${user.name},`,
      "",
      "A platform account has been created and activated for you.",
      `Username: ${user.username}`,
      `Login URL: ${appUrl}/login`,
      "",
      "Your password was set during account creation and is not included in this email for security."
    ].join("\n")
  });
  await audit("users.create_platform", "User", user.id, {
    userId: session.user.id,
    metadata: { email }
  });
  await securityLog("USER_CREATED", "Platform user created", { userId: session.user.id, metadata: { createdUserId: user.id } });
  revalidatePath("/admin/users");
}

export async function updateUserProfileAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = profileSchema.parse(Object.fromEntries(formData));
  const email = parsed.email.toLowerCase();
  const username = parsed.username.toLowerCase();
  const conflict = await prisma.user.findFirst({
    where: {
      id: { not: parsed.id },
      OR: [{ email }, { username }]
    },
    select: { id: true }
  });
  if (conflict) {
    throw new Error("Email or username is already in use.");
  }
  await prisma.user.update({
    where: { id: parsed.id },
    data: { name: parsed.name, email, username }
  });
  await audit("users.update_profile", "User", parsed.id, { userId: session.user.id });
  revalidatePath("/admin/users");
}

export async function changeUserPasswordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = passwordSchema.parse(Object.fromEntries(formData));
  await prisma.user.update({
    where: { id: parsed.id },
    data: {
      passwordHash: await hashPassword(parsed.password),
      forcePasswordReset: false,
      status: "ACTIVE"
    }
  });
  await securityLog("PASSWORD_CHANGED", "User password changed by Super Admin", {
    userId: session.user.id,
    metadata: { targetUserId: parsed.id }
  });
  await audit("users.change_password", "User", parsed.id, { userId: session.user.id });
  revalidatePath("/admin/users");
}

export async function resetUserPasswordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  const token = await createActivationToken(user.email);
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await sendMail({
    to: user.email,
    subject: "KIM-ERB password reset",
    text: [
      `Hello ${user.name},`,
      "",
      "A password reset was requested for your KIM-ERB account.",
      `Reset link: ${appUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`,
      "",
      "No password is included in this email."
    ].join("\n")
  });
  await audit("users.reset_password_email", "User", id, { userId: session.user.id });
  revalidatePath("/admin/users");
}

export async function resendUserWelcomeEmailAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: { company: true } });
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await sendMail({
    to: user.email,
    subject: "Welcome to KIM-ERB",
    text: [
      `Hello ${user.name},`,
      "",
      `${user.company?.name ?? "KIM-ERB Platform"} account is active.`,
      `Username: ${user.username}`,
      `Login URL: ${appUrl}/login`,
      "",
      "Your password is never included in welcome emails."
    ].join("\n")
  });
  await audit("users.resend_welcome", "User", id, { userId: session.user.id });
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
