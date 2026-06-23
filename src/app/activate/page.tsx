import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActivatePage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.toLowerCase();
  const token = params.token;
  let activated = false;
  let message = "Activation link is invalid or expired.";

  if (email && token) {
    const verification = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } }
    });
    if (verification && verification.expires > new Date()) {
      await prisma.$transaction([
        prisma.user.update({
          where: { email },
          data: { status: "ACTIVE", emailVerified: new Date() }
        }),
        prisma.verificationToken.delete({
          where: { identifier_token: { identifier: email, token } }
        })
      ]);
      activated = true;
      message = "Your account is active. You can sign in now.";
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo />
          <div className={`mt-4 grid size-12 place-items-center rounded-xl ${activated ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {activated ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
          </div>
          <CardTitle>{activated ? "Account Activated" : "Activation Failed"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-slate-500">{message}</p>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
