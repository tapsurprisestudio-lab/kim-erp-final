import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CompanySuspendedPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const query = await searchParams;
  const deleted = query.reason === "deleted";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="max-w-lg">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-bold text-slate-950">{deleted ? "Workspace inactive" : "Workspace suspended"}</h1>
          <p className="text-sm leading-6 text-slate-600">
            {deleted
              ? "This company workspace is no longer active. Please contact support."
              : "Your company workspace has been temporarily suspended. Please contact support."}
          </p>
          <Button asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
