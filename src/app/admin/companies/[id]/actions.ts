"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, securityLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { sendMail } from "@/lib/email";
import { generateWelcomeContract } from "@/lib/pdf/welcome-contract";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["ACTIVE", "TRIAL", "SUSPENDED"]);

export async function updateCompanyStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await prisma.company.update({ where: { id }, data: { status } });
  await audit("companies.status_update", "Company", id, {
    userId: session.user.id,
    metadata: { status }
  });
  if (status === "SUSPENDED") {
    await securityLog("COMPANY_SUSPENDED", "Company suspended", { companyId: id, userId: session.user.id });
  }
  revalidatePath(`/admin/companies/${id}`);
  revalidatePath("/admin/companies");
}

export async function softDeleteCompanyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.company.update({
    where: { id },
    data: { status: "DELETED", deletedAt: new Date() }
  });
  await audit("companies.delete", "Company", id, { userId: session.user.id });
  await securityLog("COMPANY_DELETED", "Company soft deleted", { companyId: id, userId: session.user.id });
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function resendCompanyWelcomeEmailAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 }
    }
  });
  if (!company?.owner) {
    throw new Error("Company owner not found.");
  }
  const plan = company.subscriptions[0]?.plan;
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;
  const contract = await generateWelcomeContract({
    companyName: company.name,
    ownerName: company.owner.name,
    ownerEmail: company.owner.email,
    planName: plan?.name ?? "Current plan",
    currencyCode: company.defaultCurrency,
    languageCode: company.defaultLanguage
  });
  const result = await sendMail({
    to: company.owner.email,
    subject: "Welcome to KIM-ERB",
    text: [
      `Welcome ${company.owner.name},`,
      "",
      `Your KIM-ERB company workspace for ${company.name} is ready and activated.`,
      `Company: ${company.name}`,
      `Owner: ${company.owner.name}`,
      `Username: ${company.owner.username}`,
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
  await audit("companies.resend_welcome", "Company", id, { userId: session.user.id, metadata: { ownerId: company.owner.id } });
  redirect(`/admin/companies/${id}?resent=1&email=${result.skipped ? "skipped" : "sent"}&username=${encodeURIComponent(company.owner.username)}`);
}
