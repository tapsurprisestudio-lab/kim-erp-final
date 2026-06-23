import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getIsoCurrencies } from "../src/lib/reference/currencies";
import { majorLanguages } from "../src/lib/reference/languages";

const prisma = new PrismaClient();

const permissionDefinitions = [
  ["platform.dashboard.read", "platform", "read"],
  ["companies.create", "companies", "create"],
  ["companies.read", "companies", "read"],
  ["companies.update", "companies", "update"],
  ["companies.delete", "companies", "delete"],
  ["subscriptions.manage", "subscriptions", "manage"],
  ["billing.manage", "billing", "manage"],
  ["plans.manage", "plans", "manage"],
  ["currencies.manage", "currencies", "manage"],
  ["languages.manage", "languages", "manage"],
  ["translations.manage", "translations", "manage"],
  ["users.manage", "users", "manage"],
  ["roles.manage", "roles", "manage"],
  ["audit.read", "audit", "read"],
  ["security.read", "security", "read"],
  ["support.manage", "support", "manage"],
  ["company.dashboard.read", "company", "read"],
  ["categories.manage", "categories", "manage"],
  ["units.manage", "units", "manage"],
  ["products.manage", "products", "manage"],
  ["warehouses.manage", "warehouses", "manage"],
  ["inventory.manage", "inventory", "manage"],
  ["stock_movements.manage", "stock_movements", "manage"],
  ["customers.manage", "customers", "manage"],
  ["suppliers.manage", "suppliers", "manage"],
  ["invoices.manage", "invoices", "manage"],
  ["reports.read", "reports", "read"],
  ["settings.manage", "settings", "manage"]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe!2026", 12);

  const permissions = await Promise.all(
    permissionDefinitions.map(([key, module, action]) =>
      prisma.permission.upsert({
        where: { key },
        update: { module, action },
        create: { key, module, action, description: `${action} ${module}` }
      })
    )
  );

  await Promise.all(
    getIsoCurrencies().map((currency) =>
      prisma.currency.upsert({
        where: { code: currency.code },
        update: {
          name: currency.name,
          symbol: currency.symbol,
          priority: currency.priority
        },
        create: {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          priority: currency.priority
        }
      })
    )
  );

  await Promise.all(
    majorLanguages.map((language) =>
      prisma.language.upsert({
        where: { code: language.code },
        update: language,
        create: language
      })
    )
  );

  await Promise.all(
    [
      { name: "Retail", slug: "retail" },
      { name: "Wholesale", slug: "wholesale" },
      { name: "Services", slug: "services" },
      { name: "Manufacturing", slug: "manufacturing" },
      { name: "Healthcare", slug: "healthcare" },
      { name: "E-Commerce", slug: "e-commerce" }
    ].map((industry) =>
      prisma.industry.upsert({
        where: { slug: industry.slug },
        update: industry,
        create: industry
      })
    )
  );

  const plans = await Promise.all(
    [
      {
        key: "basic",
        name: "Basic",
        monthlyPrice: "120",
        annualPrice: "1200",
        maxUsers: 5,
        maxProducts: 1000,
        features: ["Products", "Inventory", "Invoices", "Reports"]
      },
      {
        key: "standard",
        name: "Standard",
        monthlyPrice: "240",
        annualPrice: "2400",
        maxUsers: 20,
        maxProducts: 10000,
        features: ["Everything in Basic", "Warehouses", "RBAC", "Support"]
      },
      {
        key: "premium",
        name: "Premium",
        monthlyPrice: "420",
        annualPrice: "4200",
        maxUsers: 60,
        maxProducts: 50000,
        features: ["Everything in Standard", "Advanced reports", "PDF automation"]
      }
    ].map((plan) =>
      prisma.plan.upsert({
        where: { key: plan.key },
        update: plan,
        create: { ...plan, currencyCode: "LYD" }
      })
    )
  );

  const superAdminRole = await prisma.role.upsert({
    where: { scope_key: { scope: "platform", key: "super_admin" } },
    update: { name: "Super Admin", system: true },
    create: { scope: "platform", key: "super_admin", name: "Super Admin", system: true }
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      })
    )
  );

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@kim-erb.com" },
    update: {
      companyId: null,
      username: "superadmin",
      passwordHash,
      name: "Super Admin",
      status: "ACTIVE",
      locale: "en",
      forcePasswordReset: false,
      deletedAt: null
    },
    create: {
      email: "admin@kim-erb.com",
      username: "superadmin",
      name: "Super Admin",
      passwordHash,
      status: "ACTIVE",
      forcePasswordReset: false,
      locale: "en"
    }
  });

  await prisma.loginAttempt.deleteMany({
    where: { email: "admin@kim-erb.com" }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id }
  });

  const demoIndustry = await prisma.industry.findUniqueOrThrow({ where: { slug: "e-commerce" } });
  const company = await prisma.company.upsert({
    where: { slug: "ziad-electronics" },
    update: { name: "Ziad Electronics", status: "TRIAL" },
    create: {
      name: "Ziad Electronics",
      slug: "ziad-electronics",
      industryId: demoIndustry.id,
      defaultCurrency: "LYD",
      defaultLanguage: "ar",
      status: "TRIAL",
      email: "owner@ziad-electronics.test",
      country: "Libya",
      city: "Tripoli"
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@ziad-electronics.test" },
    update: { companyId: company.id, passwordHash, status: "ACTIVE" },
    create: {
      companyId: company.id,
      email: "owner@ziad-electronics.test",
      username: "ziad.owner",
      name: "Ziad Alsayed",
      passwordHash,
      status: "ACTIVE",
      locale: "ar"
    }
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { ownerId: owner.id }
  });

  const ownerRole = await prisma.role.upsert({
    where: { scope_key: { scope: company.id, key: "owner" } },
    update: { name: "Owner", system: true },
    create: { companyId: company.id, scope: company.id, key: "owner", name: "Owner", system: true }
  });

  const companyPermissions = permissions.filter((permission) => !permission.key.startsWith("platform."));
  await Promise.all(
    companyPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: ownerRole.id,
          permissionId: permission.id
        }
      })
    )
  );

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: owner.id, roleId: ownerRole.id }
  });

  await prisma.subscription.upsert({
    where: { id: `${company.id}-trial` },
    update: { status: "TRIAL", planId: plans[1].id },
    create: {
      id: `${company.id}-trial`,
      companyId: company.id,
      planId: plans[1].id,
      status: "TRIAL",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  console.log("Seed complete. Super Admin: admin@kim-erb.com / ChangeMe!2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
