import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const { companyId } = await requireTenant();
  const [company, invoices, payments] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.invoice.aggregate({ where: { companyId, deletedAt: null }, _sum: { total: true, taxTotal: true }, _count: true }),
    prisma.payment.aggregate({ where: { companyId }, _sum: { amount: true }, _count: true })
  ]);
  const currency = company?.defaultCurrency ?? "USD";
  const buffer = await generateKeyValuePdf({
    title: "Sales Report",
    subtitle: company?.name,
    rows: [
      ["Invoices", invoices._count],
      ["Revenue", `${Number(invoices._sum.total ?? 0).toFixed(2)} ${currency}`],
      ["Tax Total", `${Number(invoices._sum.taxTotal ?? 0).toFixed(2)} ${currency}`],
      ["Payments", payments._count],
      ["Collected", `${Number(payments._sum.amount ?? 0).toFixed(2)} ${currency}`],
      ["Generated At", new Date().toLocaleString()]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"sales-report.pdf\"" }
  });
}
