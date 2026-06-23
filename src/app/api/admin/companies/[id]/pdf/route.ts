import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/session";
import { generateCompanyProfilePdf } from "@/lib/pdf/business-documents";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: { owner: true, subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 } }
  });
  if (!company) {
    return new NextResponse("Company not found", { status: 404 });
  }
  const buffer = await generateCompanyProfilePdf({
    company: {
      name: company.name,
      registrationNo: company.registrationNo,
      taxNumber: company.taxNumber,
      ownerName: company.owner?.name,
      ownerUsername: company.owner?.username,
      email: company.email,
      phone: company.phone,
      country: company.country,
      city: company.city,
      defaultLanguage: company.defaultLanguage,
      defaultCurrency: company.defaultCurrency,
      planName: company.subscriptions[0]?.plan.name,
      status: company.status,
      loginUrl: `${process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`,
      createdAt: company.createdAt.toLocaleDateString()
    }
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${company.slug}-profile.pdf"`
    }
  });
}
