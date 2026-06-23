import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardAdminAliasPage() {
  await requireSuperAdmin();
  redirect("/dashboard");
}
