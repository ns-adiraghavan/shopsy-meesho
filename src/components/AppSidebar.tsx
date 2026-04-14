import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Tag,
  Sparkles,
  Package,
  CheckCircle2,
  Wallet,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoColor from "@/assets/netscribes-logo-color.png";
import logoWhite from "@/assets/netscribes-logo-white.png";

const navItems = [
  { title: "Competitive Overview",      url: "/dashboard",            icon: LayoutDashboard },
  { title: "Pricing & Promotions",      url: "/dashboard/pricing",    icon: Tag },
  { title: "Gen Z Demand Signals",      url: "/dashboard/genz",       icon: Sparkles },
  { title: "Assortment Intelligence",   url: "/dashboard/assortment", icon: Package },
  { title: "Demand & Availability",     url: "/dashboard/demand",     icon: CheckCircle2 },
  { title: "Promotion Budget Optimizer", url: "/dashboard/budget",    icon: Wallet },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 hover:opacity-80 transition-opacity">
          {collapsed ? (
            <img src={theme === "dark" ? logoWhite : logoColor} alt="Netscribes" className="h-6 w-6 object-contain shrink-0" />
          ) : (
            <img src={theme === "dark" ? logoWhite : logoColor} alt="Netscribes" className="h-7 w-auto object-contain" />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-2",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <div className="text-xs text-muted-foreground px-2 py-1">
            Data: Shopsy vs Meesho | Apr 2026
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && (
              <span className="text-xs">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            )}
          </Button>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live Data</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
