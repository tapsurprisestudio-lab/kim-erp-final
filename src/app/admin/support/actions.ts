"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const ticketStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]);

export async function updateTicketStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const status = ticketStatusSchema.parse(formData.get("status"));
  await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      assigneeId: session.user.id,
      closedAt: status === "CLOSED" ? new Date() : null
    }
  });
  await audit("support.status_update", "SupportTicket", id, {
    userId: session.user.id,
    metadata: { status }
  });
  revalidatePath("/admin/support");
}
