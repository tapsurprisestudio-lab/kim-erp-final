"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getIsoCurrencies } from "@/lib/reference/currencies";

const currencySchema = z.object({
  code: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2),
  symbol: z.string().trim().min(1),
  exchangeRate: z.coerce.number().positive()
});

export async function syncIsoCurrenciesAction() {
  const session = await requireSuperAdmin();
  const currencies = getIsoCurrencies();
  await prisma.$transaction(
    currencies.map((currency) =>
      prisma.currency.upsert({
        where: { code: currency.code },
        update: {
          name: currency.name,
          symbol: currency.symbol,
          priority: currency.priority,
          active: true
        },
        create: {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          priority: currency.priority,
          active: true
        }
      })
    )
  );
  await audit("currencies.sync_iso4217", "Currency", null, {
    userId: session.user.id,
    metadata: { count: currencies.length }
  });
  revalidatePath("/admin/currencies");
}

export async function upsertCurrencyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = currencySchema.parse(Object.fromEntries(formData));
  await prisma.currency.upsert({
    where: { code: parsed.code },
    update: {
      name: parsed.name,
      symbol: parsed.symbol,
      exchangeRate: parsed.exchangeRate,
      active: true
    },
    create: {
      code: parsed.code,
      name: parsed.name,
      symbol: parsed.symbol,
      exchangeRate: parsed.exchangeRate,
      active: true
    }
  });
  await audit("currencies.upsert", "Currency", parsed.code, {
    userId: session.user.id,
    metadata: parsed
  });
  revalidatePath("/admin/currencies");
}

export async function toggleCurrencyAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const code = z.string().length(3).parse(formData.get("code"));
  const active = formData.get("active") === "true";
  await prisma.currency.update({ where: { code }, data: { active } });
  await audit("currencies.toggle", "Currency", code, {
    userId: session.user.id,
    metadata: { active }
  });
  revalidatePath("/admin/currencies");
}
