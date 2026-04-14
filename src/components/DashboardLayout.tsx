import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { RetailCopilot } from "@/components/RetailCopilot";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "All Categories",
  "Women's Western Wear",
  "Women's Ethnic Wear",
  "Men's Casual Wear",
  "Kidswear",
  "Innerwear & Loungewear",
  "Footwear",
  "Beauty & Skincare",
  "Accessories",
  "Home & Kitchen",
  "Men's Ethnic Wear",
];

export function DashboardLayout() {
  const { loaded: _loaded } = useData();
  const navigate = useNavigate();
  const [category, setCategory] = useState("All Categories");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0 min-h-14">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold tracking-tight text-foreground">Shopsy</span>
              <span className="text-[10px] text-muted-foreground font-normal">vs</span>
              <span className="text-xs font-semibold tracking-tight text-foreground">Meesho</span>
              <span className="ml-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium px-2 py-0.5">Fashion · Apr 2026</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <span>Synthetic · Apr 2026</span>
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
      <RetailCopilot />
    </SidebarProvider>
  );
}
