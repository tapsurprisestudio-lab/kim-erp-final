"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { sendMail } from "@/lib/email";
import { generateWelcomeContract } from "@/lib/pdf/welcome-contract";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { slugify } from "@/lib/utils";

const createCompanySchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  ownerName: z.string().trim().min(2, "Owner name is required."),
  ownerEmail: z.string().trim().email("Owner email must be valid."),
  username: z.string().trim().min(2, "Username is required.").regex(/^[a-zA-Z0-9._-]+$/, "Username can contain letters, numbers, dots, dashes and underscores."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password is required."),
  industryId: z.string().min(1),
  planId: z.string().min(1),
  defaultCurrency: z.string().length(3, "Currency is required."),
  defaultLanguage: z.string().min(2, "Language is required."),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563EB"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#8B5CF6"),
  taxNumber: z.string().optional(),
  registrationNo: z.string().optional(),
  phone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  country: z.string().optional(),
  city: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Confirm password must match password."
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

export async function createCompanyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = createCompanySchema.parse(Object.fromEntries(formData));
  const slug = slugify(parsed.companyName);
  const username = parsed.username.toLowerCase();
  const ownerEmail = parsed.ownerEmail.toLowerCase();
  const [existingUsername, existingEmail, existingCompany] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } }),
    prisma.company.findUnique({ where: { slug }, select: { id: true } })
  ]);
  if (existingUsername) {
    throw new Error("Username is already in use.");
  }
  if (existingEmail) {
    throw new Error("Owner email is already in use.");
  }
  if (existingCompany) {
    throw new Error("Company name already exists. Use a unique company name.");
  }
  const passwordHash = await hashPassword(parsed.password);
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
        email: parsed.companyEmail || null,
        country: parsed.country || null,
        city: parsed.city || null,
        status: "ACTIVE"
      }
    });

    const owner = await tx.user.create({
      data: {
        companyId: company.id,
        name: parsed.ownerName,
        email: ownerEmail,
        username,
        passwordHash,
        forcePasswordReset: false,
        locale: parsed.defaultLanguage,
        status: "ACTIVE",
        emailVerified: new Date()
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
        name: "OWNER",
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
        status: "ACTIVE",
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
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;

  const emailResult = await sendMail({
    to: owner.email,
    subject: "Welcome to KIM-ERB",
    text: [
      `Welcome ${owner.name},`,
      "",
      `Your KIM-ERB company workspace for ${company.name} is ready and activated.`,
      `Company: ${company.name}`,
      `Owner: ${owner.name}`,
      `Username: ${owner.username}`,
      `Login URL: ${loginUrl}`,
      "",
      "Your password was set during company creation and is not included in this email for security.",
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
  redirect(`/admin/companies/${company.id}?created=1&email=${emailResult.skipped ? "skipped" : "sent"}&username=${encodeURIComponent(owner.username)}`);
}
