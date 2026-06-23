import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="kim-logo-mark relative">
        <Hexagon className="absolute size-8 opacity-75" strokeWidth={2.2} />
        <span className="relative text-xl font-black tracking-normal">K</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-black tracking-normal text-slate-950">
            KIM-<span className="text-primary">ERB</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Super Admin</div>
        </div>
      )}
    </div>
  );
}
