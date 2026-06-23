import { notFound } from "next/navigation";
import { PrintButton } from "@/components/app/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireTenant();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { company: true, customer: true, items: true }
  });
  if (!invoice) notFound();

  return (
    <main className="mx-auto max-w-4xl bg-white p-6 print:p-0">
      <div className="mb-4 print:hidden">
        <PrintButton label="Print invoice" />
      </div>
      <Card>
        <CardContent className="space-y-6 p-8">
          <header className="border-b pb-4">
            <h1 className="text-2xl font-bold text-slate-950">Invoice {invoice.number}</h1>
            <p className="text-sm text-slate-500">{invoice.company.name}</p>
          </header>
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-400">Customer</p>
              <p className="font-semibold">{invoice.customer?.name ?? "Walk-in customer"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Date</p>
              <p className="font-semibold">{invoice.issueDate.toLocaleDateString()}</p>
            </div>
          </section>
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.quantity.toString()}</td>
                  <td className="p-3">{formatMoney(Number(item.unitPrice), invoice.currencyCode)}</td>
                  <td className="p-3">{formatMoney(Number(item.total), invoice.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(Number(invoice.subtotal), invoice.currencyCode)}</strong></div>
            <div className="flex justify-between"><span>Tax</span><strong>{formatMoney(Number(invoice.taxTotal), invoice.currencyCode)}</strong></div>
            <div className="flex justify-between text-lg"><span>Total</span><strong>{formatMoney(Number(invoice.total), invoice.currencyCode)}</strong></div>
          </div>
          <footer className="grid grid-cols-2 gap-8 pt-10 text-sm text-slate-500">
            <div className="border-t pt-2">Prepared by</div>
            <div className="border-t pt-2">Customer signature</div>
          </footer>
        </CardContent>
      </Card>
    </main>
  );
}
