"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { sendMail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  audience: z.enum(["all_companies", "company", "companies", "user", "owners"]),
  companyIds: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().trim().min(2),
  body: z.string().trim().min(2),
  priority: z.enum(["info", "warning", "urgent"]),
  actionLink: z.string().url().optional().or(z.literal("")),
  expiresAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional())
});

type MessageTarget = { companyId: string | null; userId: string | null; email: string | null };

async function resolveTargets(parsed: z.infer<typeof messageSchema>): Promise<MessageTarget[]> {
  const companyIds = parsed.companyIds?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
  if (parsed.audience === "all_companies") {
    const companies = await prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, owner: true } });
    return companies.map((company) => ({ companyId: company.id, userId: company.owner?.id ?? null, email: company.owner?.email ?? null }));
  }
  if (parsed.audience === "companies") {
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds }, deletedAt: null }, select: { id: true, owner: true } });
    return companies.map((company) => ({ companyId: company.id, userId: company.owner?.id ?? null, email: company.owner?.email ?? null }));
  }
  if (parsed.audience === "company" && companyIds[0]) {
    const company = await prisma.company.findFirst({ where: { id: companyIds[0], deletedAt: null }, select: { id: true, owner: true } });
    return company ? [{ companyId: company.id, userId: company.owner?.id ?? null, email: company.owner?.email ?? null }] : [];
  }
  if (parsed.audience === "owners") {
    const companies = await prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, owner: true } });
    return companies.filter((company) => company.owner).map((company) => ({ companyId: company.id, userId: company.owner?.id ?? null, email: company.owner?.email ?? null }));
  }
  if (parsed.audience === "user" && parsed.userId) {
    const user = await prisma.user.findUnique({ where: { id: parsed.userId }, select: { id: true, companyId: true, email: true } });
    return user ? [{ companyId: user.companyId, userId: user.id, email: user.email }] : [];
  }
  return [];
}

export async function sendPlatformMessageAction(formData: FormData) {
  let sent = 0;
  try {
    const session = await requireSuperAdmin();
    const parsed = messageSchema.parse(Object.fromEntries(formData));
    const actionLink = parsed.actionLink || null;
    const expiresAt = parsed.expiresAt ?? null;
    const targets = await resolveTargets(parsed);
    if (targets.length === 0) {
      sent = -1;
    }

    if (sent === 0) {
      for (const target of targets) {
        const message = await prisma.platformMessage.create({
          data: {
            senderId: session.user.id,
            companyId: target.companyId,
            userId: target.userId,
            audience: parsed.audience,
            title: parsed.title,
            body: parsed.body,
            priority: parsed.priority,
            actionLink,
            expiresAt
          }
        });
        await createNotification({
          companyId: target.companyId,
          userId: target.userId,
          title: parsed.title,
          body: parsed.body,
          type: "platform_message",
          priority: parsed.priority,
          actionLink,
          expiresAt
        });
        if (target.email) {
          await sendMail({
            to: target.email,
            subject: parsed.title,
            text: [parsed.body, "", actionLink ? `Action link: ${actionLink}` : "", "Message from KIM-ERB Platform."].filter(Boolean).join("\n")
          });
        }
        await audit("platform_messages.sent", "PlatformMessage", message.id, {
          userId: session.user.id,
          companyId: target.companyId ?? undefined,
          metadata: { audience: parsed.audience, priority: parsed.priority }
        });
        sent += 1;
      }
    }

    revalidatePath("/admin/platform-messages");
    revalidatePath("/admin/notifications");
    revalidatePath("/erp/notifications");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("[platform-messages:send-failed]", error);
    redirect("/admin/platform-messages?error=send-failed");
  }
  if (sent < 0) {
    redirect("/admin/platform-messages?error=no-target");
  }
  redirect(`/admin/platform-messages?sent=${sent}`);
}
