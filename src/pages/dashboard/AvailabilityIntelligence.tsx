// @ts-nocheck
import { KPICard } from "@/components/dashboard/KPICard";
import { getAvailabilityByPlatform, getAvailabilityData, GlobalFilters } from "@/data/dataLoader";
import { StockoutImpactAnalysis } from "@/components/dashboard/StockoutImpactAnalysis";
import { HyperlocalAvailabilityTracker } from "@/components/dashboard/HyperlocalAvailabilityTracker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";


const AvailabilityIntelligence = () => {
  const filters = useOutletContext<GlobalFilters>();

  // Availability by platform: ignore global platform filter to show all platforms
  const availabilityByPlatform = getAvailabilityByPlatform(filters);
  // Full data respecting all filters
  const availabilityData = getAvailabilityData(filters);

  // ── Reliability chart data ─────────────────────────────────────────────────
  const reliabilityRaw: Record<string, { available: number; stockout: number; total: number }> = {};
  availabilityData.forEach((row) => {
    if (!reliabilityRaw[row.platform]) reliabilityRaw[row.platform] = { available: 0, stockout: 0, total: 0 };
    reliabilityRaw[row.platform].total++;
    if (row.availability_flag === 1) reliabilityRaw[row.platform].available++;
    else reliabilityRaw[row.platform].stockout++;
  });

  const reliabilityData = Object.entries(reliabilityRaw).map(([platform, d]) => ({
    platform,
    "Availability %": parseFloat(((d.available / d.total) * 100).toFixed(1)),
    "Stockout %": parseFloat(((d.stockout / d.total) * 100).toFixed(1)),
  }));

  // ── Must-Have SKU Availability ─────────────────────────────────────────────
  const mustHaveRaw: Record<string, { sum: number; count: number }> = {};
  availabilityData.forEach((row) => {
    if (row.must_have_flag !== 1) return;
    if (!mustHaveRaw[row.platform]) mustHaveRaw[row.platform] = { sum: 0, count: 0 };
    mustHaveRaw[row.platform].sum += row.availability_flag;
    mustHaveRaw[row.platform].count++;
  });

  const mustHaveData = Object.entries(mustHaveRaw)
    .map(([platform, { sum, count }]) => ({
      platform,
      "Must-Have Availability %": parseFloat(((sum / count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b["Must-Have Availability %"] - a["Must-Have Availability %"]);

  // ── Category Availability Health ──────────────────────────────────────────
  const categoryRaw: Record<string, { sum: number; count: number }> = {};
  availabilityData.forEach((row) => {
    if (!categoryRaw[row.category]) categoryRaw[row.category] = { sum: 0, count: 0 };
    categoryRaw[row.category].sum += row.availability_flag;
    categoryRaw[row.category].count++;
  });

  const categoryAvailData = Object.entries(categoryRaw)
    .map(([category, { sum, count }]) => ({
      category,
      "Availability %": parseFloat(((sum / count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b["Availability %"] - a["Availability %"])
    .slice(0, 8);

  const sorted = [...availabilityByPlatform].sort((a, b) => a.rate - b.rate);
  const avgAvailability =
    availabilityByPlatform.length > 0
      ? availabilityByPlatform.reduce((s, p) => s + p.rate, 0) / availabilityByPlatform.length
      : 0;
  const lowestPlatform = sorted[0];
  const highestPlatform = sorted[sorted.length - 1];
  const availabilityGap =
    highestPlatform && lowestPlatform ? highestPlatform.rate - lowestPlatform.rate : 0;

  const kpis = [
    { title: "SKU Availability Rate", value: `${avgAvailability.toFixed(1)}%`, change: 0.4, trend: "up" as const, tooltip: "SKU Availability Rate: % of tracked SKU observations where the product was in stock, averaged across all platforms and categories." },
    { title: "Best Platform", value: highestPlatform ? highestPlatform.platform : "—", change: highestPlatform ? highestPlatform.rate : undefined, trend: "up" as const, tooltip: "Platform with the highest average SKU Availability Rate." },
    { title: "Lowest Platform", value: lowestPlatform ? lowestPlatform.platform : "—", change: lowestPlatform ? lowestPlatform.rate : undefined, trend: "down" as const, tooltip: "Platform with the lowest average SKU Availability Rate." },
    { title: "Availability Gap", value: `${availabilityGap.toFixed(1)}%`, change: availabilityGap, trend: availabilityGap > 5 ? ("down" as const) : ("up" as const), tooltip: "Difference in SKU Availability Rate between the best and worst-performing platforms." },
  ];

  const barColor = (rate: number) =>
    rate >= 95 ? "bg-status-low" : rate >= 90 ? "bg-status-medium" : "bg-status-high";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Availability Intelligence</h1>
          <p className="text-sm text-muted-foreground">Track stockouts, fill rates, and inventory gaps across platforms and cities</p>
        </div>
      </div>

      <PageControlBar exportLabel="availability_tracking" exportData={availabilityData as unknown as Record<string, unknown>[]} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {(() => {
        const reliabilityTop = [...availabilityByPlatform].sort((a, b) => b.rate - a.rate)[0];
        const catRiskBottom = [...categoryAvailData].sort((a, b) => a["Availability %"] - b["Availability %"])[0];
        const mustHaveTop = mustHaveData[0];
        const insights: Insight[] = [
          reliabilityTop
            ? { icon: "shield", title: "Platform Reliability", body: `${reliabilityTop.platform} is the most reliable platform with a ${reliabilityTop.rate}% availability rate — the lowest risk of stockouts.`, type: "positive" }
            : { icon: "shield", title: "Platform Reliability", body: "No availability data available.", type: "neutral" },
          catRiskBottom
            ? { icon: "trend-down", title: "Category Risk", body: `${catRiskBottom.category} has the lowest availability at ${catRiskBottom["Availability %"]}%, flagging it as the highest-risk category for stockouts.`, type: catRiskBottom["Availability %"] < 80 ? "critical" : "warning" }
            : { icon: "trend-down", title: "Category Risk", body: "No category availability data.", type: "neutral" },
          mustHaveTop
            ? { icon: "target", title: "Must-Have SKU Health", body: `${mustHaveTop.platform} maintains the strongest availability on must-have SKUs at ${mustHaveTop["Must-Have Availability %"]}%.`, type: "positive" }
            : { icon: "target", title: "Must-Have SKU Health", body: "No must-have SKU data for this filter.", type: "neutral" },
        ];
        return <StrategicInsightsPanel insights={insights} />;
      })()}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Reliability Comparison</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Platform Reliability Comparison</CardTitle>
            <CardDescription>Availability vs stockout rate per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {reliabilityData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={reliabilityData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="Availability %" fill="hsl(var(--status-low))"      radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Stockout %"     fill="hsl(var(--status-critical))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Must-Have SKU Availability</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Must-Have SKU Availability</CardTitle>
            <CardDescription>Avg availability rate for critical SKUs (must_have_flag = 1) per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {mustHaveData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No must-have SKU data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mustHaveData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Must-Have Availability"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="Must-Have Availability %" fill="hsl(var(--status-low))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Availability Health</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Category Availability Health</CardTitle>
            <CardDescription>Top 8 categories by avg availability rate</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryAvailData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={categoryAvailData} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Availability"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="Availability %" fill="hsl(var(--status-low))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Availability Rates</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Platform Availability Rates</CardTitle>
            <CardDescription>% of tracked SKUs currently in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availabilityByPlatform.map((p) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{p.platform}</span>
                    <span className="text-muted-foreground">{p.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(p.rate)}`} style={{ width: `${p.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <StockoutImpactAnalysis filters={filters} />

      <HyperlocalAvailabilityTracker filters={filters} />
    </div>
  );
};

export default AvailabilityIntelligence;
