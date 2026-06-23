import { Bell, Search, Settings2, Sun } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";

export function Topbar({ userName = "Super Admin" }: { userName?: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white/85 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Logo compact />
        <span className="font-bold">KIM-ERB</span>
      </div>
      <div className="hidden w-full max-w-md items-center gap-2 rounded-full bg-slate-50 px-3 lg:flex">
        <Search className="size-4 text-slate-400" strokeWidth={1.8} />
        <Input className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" placeholder="Search anything..." />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Theme">
          <Sun className="size-4" strokeWidth={1.8} />
        </button>
        <button className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Settings">
          <Settings2 className="size-4" strokeWidth={1.8} />
        </button>
        <button className="relative grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell className="size-4" strokeWidth={1.8} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
        </button>
        <div className="hidden items-center gap-3 rounded-full border border-slate-100 bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
          <div className="grid size-8 place-items-center rounded-full bg-blue-50 text-xs font-bold text-primary">SA</div>
          <span className="text-sm font-medium text-slate-700">{userName}</span>
        </div>
      </div>
    </header>
  );
}
