# KIM-ERB

KIM-ERB is a multi-tenant SaaS ERP foundation built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js credentials auth, RBAC, tenant isolation, audit/security logs, global currencies, languages, subscriptions, billing foundation, and inventory operations.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth credentials provider
- Zod validation
- Lucide icons
- React PDF welcome contract generation
- SMTP email integration

## Required Environment Variables

Create these variables in Vercel Project Settings, and keep local secrets in `.env`. Do not commit `.env`.

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
APP_URL=
```

For Vercel production:

```bash
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
APP_URL=https://your-vercel-domain.vercel.app
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## PostgreSQL Setup

Use a managed PostgreSQL database such as Vercel Postgres, Neon, Supabase, Railway, or Render.

1. Create a PostgreSQL database.
2. Copy its pooled or direct connection string.
3. Set `DATABASE_URL` in Vercel.
4. For local development, set the same value in `.env`.

Example local shape:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

## Vercel Deployment

1. Push this project to GitHub.
2. Create a new Vercel project from the GitHub repository.
3. Set the framework preset to Next.js.
4. Add all required environment variables.
5. Deploy.

`vercel.json` sets:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

`postinstall` runs `prisma generate`, so Prisma Client is generated during Vercel install.

## Database Sync And Seed

After environment variables are configured:

```bash
npx prisma db push
npm run db:seed
```

The seed creates currencies, languages, permissions, plans, industries, one platform Super Admin, and a sample tenant owner.

## Default Super Admin

```text
Email: admin@kim-erb.com
Password: ChangeMe!2026
```

Change this password immediately after first production login.

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev -- -p 3000
```

Open:

```text
http://localhost:3000/login
```

## Validation

Run before pushing:

```bash
npm run lint
npm run typecheck
npm run build
```

## Security Notes

- `.env` is ignored by git and must not be committed.
- Passwords are hashed with bcrypt before storage.
- Auth routes use Auth.js credentials authorization.
- Admin routes are protected by middleware and require `super_admin`.
- Tenant ERP pages use tenant-specific guards and permission checks.
- Critical business records use soft delete where applicable.
- Audit and security logs record sensitive platform actions.

## Modules Implemented

- Authentication
- Super Admin dashboard
- Company management
- Company onboarding wizard
- Subscription plans
- Subscription management
- Subscription billing foundation
- Currency management and ISO 4217 sync
- LYD-first currency defaults
- Language management
- Translation foundation
- Users
- Roles and permissions
- Industries
- Audit logs
- Security center
- Support tickets
- Products
- Categories
- Units
- Warehouses
- Inventory
- Inventory dashboard
- Stock movements

## Deployment Folder

Upload or push the repository root folder:

```text
C:\Users\ahmed\OneDrive\Documents\kim
```

Do not upload:

- `node_modules`
- `.next`
- `.env`
- `tsconfig.tsbuildinfo`
- local log files
