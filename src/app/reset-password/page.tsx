import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/app/reset-password/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.toLowerCase() ?? "";
  const token = params.token ?? "";
  const verification = email && token
    ? await prisma.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token } } })
    : null;
  const valid = Boolean(verification && verification.expires > new Date());

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo />
          <div className="mt-4 grid size-12 place-items-center rounded-xl bg-blue-50 text-primary">
            <KeyRound className="size-6" />
          </div>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {valid ? (
            <form action={resetPasswordAction} className="space-y-3">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="token" value={token} />
              <Input name="password" type="password" minLength={8} placeholder="New password" required />
              <Input name="confirmPassword" type="password" minLength={8} placeholder="Confirm password" required />
              <Button className="w-full" type="submit">Update Password</Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-500">This password reset link is invalid or expired.</p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
