import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const quotation = await prisma.quotation.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { company: true, customer: true, items: true }
  });
  if (!quotation) return new NextResponse("Quotation not found", { status: 404 });
  const buffer = await generateKeyValuePdf({
    title: `Quotation ${quotation.number}`,
    subtitle: `${quotation.company.name} | ${quotation.customer?.name ?? "Customer"}`,
    rows: [
      ["Company", quotation.company.name],
      ["Customer", quotation.customer?.name],
      ["Issue Date", quotation.issueDate.toLocaleDateString()],
      ["Expires At", quotation.expiresAt?.toLocaleDateString()],
      ["Items", quotation.items.map((item) => `${item.description} x ${item.quantity.toString()}`).join(", ")],
      ["Subtotal", quotation.subtotal.toString()],
      ["Tax", quotation.taxTotal.toString()],
      ["Total", `${quotation.total.toString()} ${quotation.currencyCode}`],
      ["Status", quotation.status]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${quotation.number}.pdf"` }
  });
}
