"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { majorLanguages } from "@/lib/reference/languages";

const languageSchema = z.object({
  code: z.string().trim().min(2).max(8).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2),
  nativeName: z.string().trim().min(1),
  direction: z.enum(["LTR", "RTL"])
});

export async function syncMajorLanguagesAction() {
  const session = await requireSuperAdmin();
  await prisma.$transaction(
    majorLanguages.map((language) =>
      prisma.language.upsert({
        where: { code: language.code },
        update: { ...language, active: true },
        create: { ...language, active: true }
      })
    )
  );
  await audit("languages.sync_major", "Language", null, {
    userId: session.user.id,
    metadata: { count: majorLanguages.length }
  });
  revalidatePath("/admin/languages");
}

export async function upsertLanguageAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = languageSchema.parse(Object.fromEntries(formData));
  await prisma.language.upsert({
    where: { code: parsed.code },
    update: { ...parsed, active: true },
    create: { ...parsed, active: true }
  });
  await audit("languages.upsert", "Language", parsed.code, {
    userId: session.user.id,
    metadata: parsed
  });
  revalidatePath("/admin/languages");
}

export async function toggleLanguageAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const code = z.string().min(2).parse(formData.get("code"));
  const active = formData.get("active") === "true";
  await prisma.language.update({ where: { code }, data: { active } });
  await audit("languages.toggle", "Language", code, {
    userId: session.user.id,
    metadata: { active }
  });
  revalidatePath("/admin/languages");
}
