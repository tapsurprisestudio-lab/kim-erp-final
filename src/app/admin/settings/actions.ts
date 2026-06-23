"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  language: z.enum(["en", "ar"]),
  theme: z.enum(["light", "dark"])
});

export async function updatePlatformSettingsAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = settingsSchema.parse(Object.fromEntries(formData));

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: parsed.language }
    });
    await prisma.translation.upsert({
      where: { languageCode_namespace_key: { languageCode: "en", namespace: "platform_settings", key: "language" } },
      update: { value: parsed.language },
      create: { languageCode: "en", namespace: "platform_settings", key: "language", value: parsed.language }
    });
    await prisma.translation.upsert({
      where: { languageCode_namespace_key: { languageCode: "en", namespace: "platform_settings", key: "theme" } },
      update: { value: parsed.theme },
      create: { languageCode: "en", namespace: "platform_settings", key: "theme", value: parsed.theme }
    });
    await audit("platform_settings.update", "PlatformSettings", session.user.id, {
      userId: session.user.id,
      metadata: parsed
    });
  } catch (error) {
    console.error("[platform-settings:update-failed]", error);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
