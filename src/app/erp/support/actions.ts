"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

const ticketSchema = z.object({
  subject: z.string().trim().min(2),
  message: z.string().trim().min(5),
  priority: z.enum(["low", "normal", "high", "urgent"])
});

export async function createTenantSupportTicketAction(formData: FormData) {
  const { session, companyId } = await requireTenant();
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
  revalidatePath("/erp/support");
}
