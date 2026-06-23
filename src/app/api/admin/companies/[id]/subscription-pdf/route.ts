import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/session";
import { generateSubscriptionSummaryPdf } from "@/lib/pdf/business-documents";
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
  const subscription = company.subscriptions[0];
  const buffer = await generateSubscriptionSummaryPdf({
    company: {
      name: company.name,
      ownerName: company.owner?.name,
      ownerEmail: company.owner?.email,
      planName: subscription?.plan.name,
      subscriptionStatus: subscription?.status,
      startsAt: subscription?.startsAt.toLocaleDateString(),
      endsAt: subscription?.endsAt.toLocaleDateString(),
      defaultCurrency: company.defaultCurrency,
      monthlyPrice: subscription ? `${subscription.plan.monthlyPrice.toString()} ${subscription.plan.currencyCode}` : null,
      annualPrice: subscription ? `${subscription.plan.annualPrice.toString()} ${subscription.plan.currencyCode}` : null,
      status: company.status,
      generatedAt: new Date().toLocaleString()
    }
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${company.slug}-subscription.pdf"`
    }
  });
}
