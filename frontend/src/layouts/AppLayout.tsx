import { PanelLeft } from "lucide-react";
import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { ServiceStatusBanner } from "@/components/ServiceStatusBanner";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { ServiceStatusProvider } from "@/hooks/useServiceStatus";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";

function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      className="-ml-1 flex h-11 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-0 text-sm font-medium outline-none hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label="Меню"
      onClick={toggleSidebar}
    >
      <PanelLeft className="size-5" />
      Меню
    </button>
  );
}

export function AppLayout() {
  return (
    <ServiceStatusProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 lg:px-6">
            <div className="md:hidden">
              <MobileSidebarTrigger />
            </div>
            <div className="ml-auto">
              <UserAccountMenu />
            </div>
          </header>

          <div className="flex flex-1 flex-col px-4 py-6 lg:px-8">
            <div className="app-main-inner flex w-full flex-col gap-6">
              <ServiceStatusBanner />
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ServiceStatusProvider>
  );
}
