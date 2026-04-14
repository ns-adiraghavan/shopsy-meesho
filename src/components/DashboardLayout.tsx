import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";

export function DashboardLayout() {
  const { loaded } = useData();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0 min-h-14">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />

            <span className="text-sm font-medium text-foreground">Shopsy vs Meesho Intelligence</span>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>Live</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                onClick={() => navigate("/")}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Log Out</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
