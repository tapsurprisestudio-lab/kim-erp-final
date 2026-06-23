import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { invoices: { include: { payments: true } } }
  });
  if (!customer) return new NextResponse("Customer not found", { status: 404 });
  const invoiced = customer.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const paid = customer.invoices.reduce((sum, invoice) => sum + invoice.payments.reduce((inner, payment) => inner + Number(payment.amount), 0), 0);
  const buffer = await generateKeyValuePdf({
    title: `Customer Statement - ${customer.name}`,
    rows: [
      ["Customer", customer.name],
      ["Email", customer.email],
      ["Phone", customer.phone],
      ["Invoices", customer.invoices.length],
      ["Total Invoiced", invoiced.toFixed(2)],
      ["Total Paid", paid.toFixed(2)],
      ["Remaining Debt", Math.max(invoiced - paid, 0).toFixed(2)],
      ["Generated At", new Date().toLocaleString()]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${customer.name}-statement.pdf"` }
  });
}
