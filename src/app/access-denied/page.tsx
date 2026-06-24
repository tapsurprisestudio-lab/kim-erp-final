import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="max-w-lg">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-bold text-slate-950">Access denied</h1>
          <p className="text-sm leading-6 text-slate-600">
            You do not have permission to open this module. Ask the company owner to update your permissions.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
