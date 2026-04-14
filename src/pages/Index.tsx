import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSKUAdjustment } from "@/contexts/SKUAdjustmentContext";
import { kpiData, heatmapData, alertsData, topRiskSKUs } from "@/data/dashboardData";
import { BarChart3, TrendingUp, Users, Globe, Undo2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const Index = () => {
  const { hasAnyAdjustments, clearAllAdjustments } = useSKUAdjustment();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">Insightly.ai</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Real-time competitive intelligence dashboard
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="self-start sm:self-center"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
                <span className="sm:hidden">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground group relative">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span>Live Data</span>
                {hasAnyAdjustments() && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-2"></div>
                )}
                {hasAnyAdjustments() && (
                  <div className="absolute -bottom-8 left-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                    You have unsaved pricing adjustments.
                  </div>
                )}
              </div>
              {hasAnyAdjustments() && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-medium hidden sm:inline">Adjustments Active</span>
                  <span className="font-medium sm:hidden">Active</span>
                </div>
              )}
              <div className="text-right text-xs sm:text-sm">
                <div className="font-medium">Last Updated</div>
                <div className="text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Undo Banner */}
      {hasAnyAdjustments() && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">
          <Alert className="border-primary/20 bg-primary/5">
            <Undo2 className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm">You have unsaved pricing adjustments from your recent analysis.</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllAdjustments}
                className="self-start sm:self-center"
              >
                <Undo2 className="mr-2 h-3 w-3" />
                Undo All Changes
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Heatmap - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <PriceHeatmap data={heatmapData} />
          </div>
          
          {/* Right Column - Alerts Panel and Quick Actions */}
          <div className="xl:col-span-1 space-y-4 lg:space-y-6">
            <AlertsPanel alerts={alertsData} />
            <div className="bg-card p-3 lg:p-6 rounded-lg border border-border">
              <QuickActions />
            </div>
          </div>
        </div>

        {/* Bottom Grid - High-Risk SKUs and Category Rollup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Risk SKUs */}
          <div className="bg-card p-3 lg:p-6 rounded-lg border border-border">
            <TopRiskSKUs skus={topRiskSKUs} />
          </div>
          
          {/* Category-Level Rollup */}
          <div className="bg-card p-3 lg:p-6 rounded-lg border border-border">
            <CategoryLevelRollup />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 pt-4 lg:pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Market Analysis</span>
            <span className="sm:hidden">Market</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Competitor Intelligence</span>
            <span className="sm:hidden">Competitors</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Regional Insights</span>
            <span className="sm:hidden">Regional</span>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
