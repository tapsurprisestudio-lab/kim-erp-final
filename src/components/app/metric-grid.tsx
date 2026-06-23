import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricGrid({
  metrics
}: {
  metrics: Array<{
    label: string;
    value: string | number;
    icon: LucideIcon;
    detail?: string;
  }>;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{metric.label}</p>
                <div className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{metric.value}</div>
                {metric.detail && <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>}
              </div>
              <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
                <Icon className="size-5" strokeWidth={1.8} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
