import { prisma } from "@/lib/prisma";

export async function getPlatformSummary() {
  const [
    companies,
    activeCompanies,
    users,
    subscriptions,
    activeSubscriptions,
    invoices,
    payments,
    billing,
    tickets,
    securityLogs,
    auditLogs,
    failedLogins
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: null, status: { in: ["ACTIVE", "TRIAL"] } } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { deletedAt: null } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.billingRecord.aggregate({ _sum: { amount: true }, _count: true, where: { deletedAt: null } }),
    prisma.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
    prisma.securityLog.count(),
    prisma.auditLog.count(),
    prisma.loginAttempt.count({ where: { success: false } })
  ]);

  return {
    companies,
    activeCompanies,
    users,
    subscriptions,
    activeSubscriptions,
    invoiceCount: invoices._count,
    invoiceTotal: Number(invoices._sum.total ?? 0),
    paymentCount: payments._count,
    paymentTotal: Number(payments._sum.amount ?? 0),
    billingCount: billing._count,
    billingTotal: Number(billing._sum.amount ?? 0),
    tickets,
    securityLogs,
    auditLogs,
    failedLogins
  };
}
