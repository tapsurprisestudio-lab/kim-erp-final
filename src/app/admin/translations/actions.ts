"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const translationSchema = z.object({
  id: z.string().optional(),
  languageCode: z.string().min(2),
  namespace: z.string().trim().min(1),
  key: z.string().trim().min(1),
  value: z.string().trim().min(1)
});

export async function saveTranslationAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = translationSchema.parse(Object.fromEntries(formData));
  const translation = parsed.id
    ? await prisma.translation.update({
        where: { id: parsed.id },
        data: { ...parsed, deletedAt: null }
      })
    : await prisma.translation.upsert({
        where: {
          languageCode_namespace_key: {
            languageCode: parsed.languageCode,
            namespace: parsed.namespace,
            key: parsed.key
          }
        },
        update: { value: parsed.value, deletedAt: null },
        create: parsed
      });
  await audit("translations.save", "Translation", translation.id, { userId: session.user.id });
  revalidatePath("/admin/translations");
}

export async function deleteTranslationAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await prisma.translation.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit("translations.delete", "Translation", id, { userId: session.user.id });
  revalidatePath("/admin/translations");
}
