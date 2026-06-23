"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { securityLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(16),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match."
});

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetSchema.parse(Object.fromEntries(formData));
  const email = parsed.email.toLowerCase();
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: parsed.token } }
  });
  if (!verification || verification.expires <= new Date()) {
    throw new Error("Password reset link is invalid or expired.");
  }
  const user = await prisma.user.update({
    where: { email },
    data: {
      passwordHash: await hashPassword(parsed.password),
      forcePasswordReset: false,
      status: "ACTIVE"
    }
  });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: parsed.token } }
  });
  await securityLog("PASSWORD_CHANGED", "User reset password from email link", { companyId: user.companyId, userId: user.id });
  redirect("/login?reset=success");
}
