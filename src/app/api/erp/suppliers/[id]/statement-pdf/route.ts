import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { expenses: true }
  });
  if (!supplier) return new NextResponse("Supplier not found", { status: 404 });
  const spend = supplier.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const buffer = await generateKeyValuePdf({
    title: `Supplier Statement - ${supplier.name}`,
    rows: [
      ["Supplier", supplier.name],
      ["Email", supplier.email],
      ["Phone", supplier.phone],
      ["Tax Number", supplier.taxNumber],
      ["Expenses", supplier.expenses.length],
      ["Total Spend", spend.toFixed(2)],
      ["Generated At", new Date().toLocaleString()]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${supplier.name}-statement.pdf"` }
  });
}
