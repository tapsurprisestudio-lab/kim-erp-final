import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountDisabledPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="max-w-lg">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-bold text-slate-950">Account disabled</h1>
          <p className="text-sm leading-6 text-slate-600">
            Your account has been disabled. Please contact your company owner or KIM-ERB support.
          </p>
          <Button asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
