import { prisma } from "@/lib/prisma";

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function assertLoginAllowed(email: string, ipAddress: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const failures = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      ipAddress,
      success: false,
      createdAt: { gte: since }
    }
  });

  if (failures >= MAX_FAILED_ATTEMPTS) {
    throw new Error("Too many failed login attempts. Try again later.");
  }
}

export async function recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
      ipAddress,
      success
    }
  });
}
