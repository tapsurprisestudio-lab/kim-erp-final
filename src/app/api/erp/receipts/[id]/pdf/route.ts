import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const receipt = await prisma.receipt.findFirst({
    where: { id, companyId },
    include: { company: true, customer: true, invoice: true }
  });
  if (!receipt) return new NextResponse("Receipt not found", { status: 404 });
  const buffer = await generateKeyValuePdf({
    title: `Receipt ${receipt.number}`,
    subtitle: `${receipt.company.name} | ${receipt.customer?.name ?? "Customer"}`,
    rows: [
      ["Company", receipt.company.name],
      ["Customer", receipt.customer?.name],
      ["Invoice", receipt.invoice?.number],
      ["Amount", `${receipt.amount.toString()} ${receipt.currencyCode}`],
      ["Issued At", receipt.issuedAt.toLocaleString()]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${receipt.number}.pdf"` }
  });
}
