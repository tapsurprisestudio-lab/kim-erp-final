import { NextResponse } from "next/server";
import { generateInvoicePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { company: true, customer: true, items: true }
  });
  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }
  const buffer = await generateInvoicePdf({
    company: invoice.company,
    invoice: {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      total: Number(invoice.total),
      currencyCode: invoice.currencyCode,
      customer: invoice.customer,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        total: Number(item.total)
      }))
    }
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`
    }
  });
}
