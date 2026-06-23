import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";

export function AppShell({
  children,
  userName,
  scope = "platform"
}: {
  children: React.ReactNode;
  userName?: string | null;
  scope?: "platform" | "tenant";
}) {
  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-white/60 shadow-soft lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-2xl lg:border lg:border-white">
        <Sidebar scope={scope} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar userName={userName} />
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6">{children}</main>
        </div>
      </div>
      <MobileNav scope={scope} />
    </div>
  );
}
