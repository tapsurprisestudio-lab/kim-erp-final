import { Tags, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/erp/categories/actions";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { session, companyId } = await requireTenantPermission("categories.manage");
  const categories = await prisma.category.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } }
  });

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <SectionHeader title="Categories" description="Organize products inside the current tenant only." icon={Tags} />
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="flex max-w-lg gap-3">
            <Input name="name" placeholder="Mobile Phones" required />
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Products</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{category.name}</td>
                  <td className="px-5 py-4 text-slate-500">{category._count.products}</td>
                  <td className="px-5 py-4">
                    <form action={updateCategoryAction} className="flex gap-2">
                      <input type="hidden" name="id" value={category.id} />
                      <Input name="name" defaultValue={category.name} className="h-9 max-w-48" />
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
