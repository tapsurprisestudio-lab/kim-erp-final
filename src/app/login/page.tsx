import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/app/login/login-form";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white bg-white shadow-soft lg:grid-cols-[1fr_0.9fr]">
        <div className="p-8 lg:p-12">
          <Logo />
          <div className="mt-12 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Ultimate business management platform</p>
            <h1 className="mt-4 text-4xl font-black tracking-normal text-slate-950">Secure access for KIM-ERB operators.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Multi-tenant ERP administration with company isolation, RBAC, audit logging, currencies, languages, and subscription control.
            </p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <div className="hidden bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 p-8 text-white lg:block">
          <div className="flex h-full flex-col justify-between rounded-xl border border-white/20 p-8">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-white/70">Platform focus</div>
              <div className="mt-6 grid gap-4">
                {["Tenant isolation", "Secure authentication", "Arabic RTL and English", "LYD-first global currency system"].map((item) => (
                  <div key={item} className="rounded-xl bg-white/12 p-4 text-sm font-medium backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-5xl font-black">KIM-ERB</div>
              <p className="mt-3 text-sm text-white/75">Support: kimerb10@gmail.com</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
