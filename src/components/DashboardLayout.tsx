import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Layers, Hash, Tag, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GlobalFilters,
  DEFAULT_FILTERS,
  getUniquePincodes,
  getUniqueCategories,
  getPincodeCityMap,
} from "@/data/dataLoader";
import { useData } from "@/contexts/DataContext";
import { RetailCopilot } from "@/components/RetailCopilot";

const CITIES = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];
const PLATFORMS = ["All Platforms", "Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

export function DashboardLayout() {
  const { loaded } = useData();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [pincodeOptions, setPincodeOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [pincodeCityMap, setPincodeCityMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loaded) return;
    setPincodeOptions(getUniquePincodes());
    setCategoryOptions(getUniqueCategories());
    setPincodeCityMap(getPincodeCityMap());
  }, [loaded]);

  const setFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // Derive associated city for currently selected pincode
  const associatedCity =
    filters.pincode !== "All Pincodes" ? pincodeCityMap[filters.pincode] : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0 min-h-14">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />

            {/* ── City ── */}
            <Select value={filters.city} onValueChange={(v) => setFilter("city", v)}>
              <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[130px] focus:ring-1 hover:bg-muted/70 transition-colors">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Platform ── */}
            <Select value={filters.platform} onValueChange={(v) => setFilter("platform", v)}>
              <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[150px] focus:ring-1 hover:bg-muted/70 transition-colors">
                <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Category ── */}
            {categoryOptions.length > 0 && (
              <Select value={filters.category} onValueChange={(v) => setFilter("category", v)}>
                <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[150px] focus:ring-1 hover:bg-muted/70 transition-colors">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories" className="text-xs">All Categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ── Pincode + Associated City ── */}
            {pincodeOptions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Select value={filters.pincode} onValueChange={(v) => setFilter("pincode", v)}>
                  <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[140px] focus:ring-1 hover:bg-muted/70 transition-colors">
                    <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Pincodes" className="text-xs">All Pincodes</SelectItem>
                    {pincodeOptions.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}{pincodeCityMap[p] ? ` · ${pincodeCityMap[p]}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {associatedCity && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 border border-border rounded-full px-2.5 py-1 shrink-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {associatedCity}
                  </span>
                )}
              </div>
            )}

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
            <Outlet context={filters} />
          </main>
        </div>
      </div>
      <RetailCopilot filters={filters} />
    </SidebarProvider>
  );
}
