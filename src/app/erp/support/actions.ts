"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createNotification, notifyPlatformAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

const ticketSchema = z.object({
  subject: z.string().trim().min(2),
  message: z.string().trim().min(5),
  priority: z.enum(["low", "normal", "high", "urgent"])
});

export async function createTenantSupportTicketAction(formData: FormData) {
  const { session, companyId } = await requireTenantPermission("company.dashboard.read");
  const parsed = ticketSchema.parse(Object.fromEntries(formData));
  const ticket = await prisma.supportTicket.create({
    data: {
      companyId,
      subject: parsed.subject,
      message: parsed.message,
      priority: parsed.priority,
      status: "OPEN"
    }
  });
  await audit("support.create", "SupportTicket", ticket.id, { companyId, userId: session.user.id });
  await createNotification({
    userId: session.user.id,
    companyId,
    title: "Support ticket created",
    body: parsed.subject,
    type: "support",
    priority: parsed.priority === "urgent" ? "urgent" : "info",
    actionLink: "/erp/support"
  });
  await notifyPlatformAdmins({
    title: "New tenant support ticket",
    body: `${session.user.companyName ?? "Company"}: ${parsed.subject}`,
    type: "support",
    priority: parsed.priority === "urgent" ? "urgent" : "warning",
    actionLink: "/admin/support"
  });
  revalidatePath("/erp/support");
  revalidatePath("/admin/support");
  revalidatePath("/admin/notifications");
}
