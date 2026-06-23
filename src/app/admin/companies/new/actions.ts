"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { sendMail } from "@/lib/email";
import { generateWelcomeContract } from "@/lib/pdf/welcome-contract";
import { prisma } from "@/lib/prisma";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { slugify } from "@/lib/utils";

const createCompanySchema = z.object({
  companyName: z.string().min(2),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  industryId: z.string().min(1),
  planId: z.string().min(1),
  defaultCurrency: z.string().length(3),
  defaultLanguage: z.string().min(2),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563EB"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#8B5CF6"),
  taxNumber: z.string().optional(),
  registrationNo: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional()
});

async function saveLogo(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Company logo must be an image.");
  }
  const extension = extname(file.name) || ".png";
  const filename = `${randomUUID()}${extension}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "companies");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/companies/${filename}`;
}

async function nextUsername(base: string) {
  const clean = slugify(base).replaceAll("-", ".") || "owner";
  const existing = await prisma.user.findMany({
    where: {
      username: {
        startsWith: clean
      }
    },
    select: { username: true }
  });
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

export async function createCompanyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = createCompanySchema.parse(Object.fromEntries(formData));
  const slug = slugify(parsed.companyName);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const username = await nextUsername(parsed.ownerEmail.split("@")[0]);
  const logoUrl = await saveLogo(formData.get("logo") as File | null);

  const { company, owner, plan } = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.findUniqueOrThrow({ where: { id: parsed.planId } });
    const company = await tx.company.create({
      data: {
        name: parsed.companyName,
        slug,
        industryId: parsed.industryId,
        defaultCurrency: parsed.defaultCurrency,
        defaultLanguage: parsed.defaultLanguage,
        logoUrl,
        primaryColor: parsed.primaryColor,
        accentColor: parsed.accentColor,
        taxNumber: parsed.taxNumber || null,
        registrationNo: parsed.registrationNo || null,
        phone: parsed.phone || null,
        country: parsed.country || null,
        city: parsed.city || null,
        status: "TRIAL"
      }
    });

    const owner = await tx.user.create({
      data: {
        companyId: company.id,
        name: parsed.ownerName,
        email: parsed.ownerEmail.toLowerCase(),
        username,
        passwordHash,
        forcePasswordReset: true,
        locale: parsed.defaultLanguage,
        status: "INVITED"
      }
    });

    await tx.company.update({
      where: { id: company.id },
      data: { ownerId: owner.id }
    });

    const ownerRole = await tx.role.create({
      data: {
        companyId: company.id,
        scope: company.id,
        key: "owner",
        name: "Owner",
        system: true
      }
    });

    const permissions = await tx.permission.findMany({
      where: {
        key: {
          not: {
            startsWith: "platform."
          }
        }
      }
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: ownerRole.id,
        permissionId: permission.id
      }))
    });

    await tx.userRole.create({
      data: {
        userId: owner.id,
        roleId: ownerRole.id
      }
    });

    await tx.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: "TRIAL",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: session.user.id,
        action: "companies.create",
        entity: "Company",
        entityId: company.id,
        metadata: {
          ownerId: owner.id,
          planId: plan.id
        }
      }
    });

    return { company, owner, plan };
  });

  const contract = await generateWelcomeContract({
    companyName: company.name,
    ownerName: owner.name,
    ownerEmail: owner.email,
    planName: plan.name,
    currencyCode: company.defaultCurrency,
    languageCode: company.defaultLanguage
  });
  const activationToken = await createActivationToken(owner.email);
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendMail({
    to: owner.email,
    subject: "Welcome to KIM-ERB",
    text: [
      `Welcome ${owner.name},`,
      "",
      `Your KIM-ERB company workspace for ${company.name} is ready.`,
      `Username: ${owner.username}`,
      `Temporary password: ${temporaryPassword}`,
      `Activation link: ${appUrl}/activate?email=${encodeURIComponent(owner.email)}&token=${activationToken}`,
      "",
      "Activate your account, then sign in and change your password immediately.",
      "Support: kimerb10@gmail.com"
    ].join("\n"),
    attachments: [
      {
        filename: "kim-erb-welcome-contract.pdf",
        content: contract,
        contentType: "application/pdf"
      }
    ]
  });

  await audit("users.create", "User", owner.id, {
    companyId: company.id,
    userId: session.user.id,
    metadata: { role: "owner" }
  });
  await securityLog("USER_CREATED", "Company owner account created", {
    companyId: company.id,
    userId: session.user.id,
    metadata: { ownerId: owner.id }
  });

  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}
