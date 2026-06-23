import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary">
            <Icon className="size-5" strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
