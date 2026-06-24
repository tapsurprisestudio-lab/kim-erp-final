import { Package, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createProductAction, deleteProductAction, toggleProductAction, updateProductAction } from "@/app/erp/products/actions";
import { normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireTenantPermission } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { session, companyId } = await requireTenantPermission("products.manage");
  const [company, products, categories, warehouses] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { defaultLanguage: true } }),
    prisma.product.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { category: true, inventoryItems: true },
      take: 100
    }),
    prisma.category.findMany({ where: { companyId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { companyId, deletedAt: null, active: true }, orderBy: { name: "asc" } })
  ]);
  const locale = normalizeLocale(company?.defaultLanguage);
  const isAr = locale === "ar";

  return (
    <AppShell userName={session.user.name} scope="tenant">
      <SectionHeader
        title={isAr ? "المنتجات" : "Products"}
        description={isAr ? "أضف منتجاتك أو خدماتك هنا. اسم المنتج فقط مطلوب، وباقي الحقول اختيارية." : "Add your products or services here. Only product name is required; all other fields are optional."}
        icon={Package}
      />
      <Card className="mb-5 border-blue-100 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-950">
          {isAr
            ? "مثال: يمكنك إضافة iPhone 15 Pro بكتابة الاسم فقط، أو إضافة السعر والمخزون والباركود لاحقا."
            : "Example: add iPhone 15 Pro with only the name, or add price, stock, barcode and specs later."}
        </CardContent>
      </Card>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>{isAr ? "إضافة أو تحديث منتج" : "Add or Update Product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="grid gap-3 lg:grid-cols-4">
            <Input name="sku" placeholder={isAr ? "رمز المنتج (اختياري)" : "SKU / code (optional)"} />
            <Input name="barcode" placeholder={isAr ? "الباركود (اختياري)" : "Barcode (optional)"} />
            <Input name="name" placeholder={isAr ? "اسم المنتج مثل iPhone 15 Pro" : "iPhone 15 Pro"} required />
            <select name="categoryId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">{isAr ? "بدون تصنيف" : "No category"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input name="brand" placeholder={isAr ? "العلامة التجارية (اختياري)" : "Brand (optional)"} />
            <Input name="model" placeholder={isAr ? "الموديل (اختياري)" : "Model (optional)"} />
            <Input name="unit" placeholder={isAr ? "الوحدة (اختياري)" : "Unit (optional)"} />
            <Input name="price" type="number" step="0.01" placeholder={isAr ? "سعر البيع (اختياري)" : "Sale price (optional)"} />
            <Input name="cost" type="number" step="0.01" placeholder={isAr ? "سعر الشراء (اختياري)" : "Purchase price (optional)"} />
            <Input name="taxRate" type="number" step="0.01" placeholder={isAr ? "الضريبة % (اختياري)" : "Tax % (optional)"} />
            <Input name="stockQuantity" type="number" step="0.001" placeholder={isAr ? "كمية البداية (اختياري)" : "Opening stock (optional)"} />
            <select name="warehouseId" className="h-10 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">{isAr ? "بدون مستودع بداية" : "No opening warehouse"}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <Input name="expiryDate" type="date" placeholder="Expiry date" />
            <Input name="serialNumber" placeholder={isAr ? "الرقم التسلسلي (اختياري)" : "Serial number (optional)"} />
            <Input name="imei" placeholder="IMEI (optional)" />
            <Input name="color" placeholder={isAr ? "اللون (اختياري)" : "Color (optional)"} />
            <Input name="size" placeholder={isAr ? "المقاس (اختياري)" : "Size (optional)"} />
            <Input name="imageUrl" placeholder={isAr ? "رابط الصورة (اختياري)" : "Image URL (optional)"} />
            <Input name="specs" placeholder={isAr ? "المواصفات (اختياري)" : "Specs (optional)"} />
            <Input name="description" placeholder={isAr ? "الوصف (اختياري)" : "Description (optional)"} />
            <div className="lg:col-span-4">
              <Button type="submit">
                <Plus className="size-4" />
                {isAr ? "حفظ المنتج" : "Save Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const stock = product.inventoryItems.reduce((sum, item) => sum + Number(item.quantity), 0);
                return (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="px-5 py-4 text-slate-500">{product.category?.name ?? "-"}</td>
                    <td className="px-5 py-4 text-slate-500">{product.price.toString()}</td>
                    <td className="px-5 py-4 text-slate-500">{stock}</td>
                    <td className="px-5 py-4">
                      <Badge variant={product.active ? "success" : "secondary"}>{product.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateProductAction} className="grid min-w-[540px] grid-cols-[0.8fr_1fr_0.9fr_0.5fr_0.6fr_auto] gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <Input name="sku" defaultValue={product.sku} className="h-9" />
                        <Input name="name" defaultValue={product.name} className="h-9" />
                        <select name="categoryId" defaultValue={product.categoryId ?? ""} className="h-9 rounded-lg border border-input bg-white px-2 text-sm">
                          <option value="">No category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <Input name="unit" defaultValue={product.unit} className="h-9" />
                        <Input name="price" type="number" step="0.01" defaultValue={product.price.toString()} className="h-9" />
                        <input type="hidden" name="barcode" value={product.barcode ?? ""} />
                        <input type="hidden" name="brand" value={product.brand ?? ""} />
                        <input type="hidden" name="model" value={product.model ?? ""} />
                        <input type="hidden" name="imageUrl" value={product.imageUrl ?? ""} />
                        <input type="hidden" name="expiryDate" value={product.expiryDate?.toISOString().slice(0, 10) ?? ""} />
                        <input type="hidden" name="serialNumber" value={product.serialNumber ?? ""} />
                        <input type="hidden" name="imei" value={product.imei ?? ""} />
                        <input type="hidden" name="color" value={product.color ?? ""} />
                        <input type="hidden" name="size" value={product.size ?? ""} />
                        <input type="hidden" name="cost" value={product.cost.toString()} />
                        <input type="hidden" name="taxRate" value={product.taxRate.toString()} />
                        <input type="hidden" name="description" value={product.description ?? ""} />
                        <Button type="submit" size="sm" variant="outline">Save</Button>
                      </form>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={toggleProductAction} className="mb-2 inline-flex">
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="active" value={String(!product.active)} />
                        <Button type="submit" size="sm" variant="outline">{product.active ? "Disable" : "Enable"}</Button>
                      </form>
                      <form action={deleteProductAction} className="inline-flex">
                        <input type="hidden" name="id" value={product.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
