import { NextResponse } from "next/server";
import { generateKeyValuePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const { companyId } = await requireTenant();
  const [company, products, warehouses, inventory] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.product.count({ where: { companyId, deletedAt: null } }),
    prisma.warehouse.count({ where: { companyId, deletedAt: null } }),
    prisma.inventoryItem.aggregate({ where: { deletedAt: null, product: { companyId, deletedAt: null } }, _sum: { quantity: true }, _count: true })
  ]);
  const buffer = await generateKeyValuePdf({
    title: "Inventory Report",
    subtitle: company?.name,
    rows: [
      ["Products", products],
      ["Warehouses", warehouses],
      ["Inventory Records", inventory._count],
      ["Stock Units", Number(inventory._sum.quantity ?? 0).toLocaleString()],
      ["Generated At", new Date().toLocaleString()]
    ]
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"inventory-report.pdf\"" }
  });
}
