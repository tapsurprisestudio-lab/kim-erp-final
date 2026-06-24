"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const ticketStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]);
const replySchema = z.object({
  id: z.string().min(1),
  message: z.string().trim().min(2)
});

export async function updateTicketStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = ticketStatusSchema.parse(formData.get("status"));
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      assigneeId: session.user.id,
      closedAt: status === "CLOSED" ? new Date() : null
    },
    include: { company: { include: { owner: true } } }
  });
  await createNotification({
    companyId: ticket.companyId,
    userId: ticket.company?.ownerId ?? null,
    title: "Support ticket updated",
    body: `${ticket.subject}: ${status}`,
    type: "support",
    priority: status === "WAITING_ON_CUSTOMER" ? "warning" : "info",
    actionLink: "/erp/support"
  });
  await audit("support.status_update", "SupportTicket", id, {
    userId: session.user.id,
    companyId: ticket.companyId ?? undefined,
    metadata: { status }
  });
  revalidatePath("/admin/support");
  revalidatePath("/erp/support");
}

export async function replyToTicketAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = replySchema.parse(Object.fromEntries(formData));
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.id },
    include: { company: true }
  });
  if (!ticket) {
    return;
  }
  const reply = await prisma.supportTicketReply.create({
    data: {
      ticketId: ticket.id,
      userId: session.user.id,
      message: parsed.message
    }
  });
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: "WAITING_ON_CUSTOMER",
      assigneeId: session.user.id
    }
  });
  await createNotification({
    companyId: ticket.companyId,
    userId: null,
    title: "Support replied",
    body: `${ticket.subject}: ${parsed.message}`,
    type: "support",
    priority: "info",
    actionLink: "/erp/support"
  });
  await audit("support.reply", "SupportTicketReply", reply.id, {
    userId: session.user.id,
    companyId: ticket.companyId ?? undefined,
    metadata: { ticketId: ticket.id }
  });
  revalidatePath("/admin/support");
  revalidatePath("/erp/support");
}
