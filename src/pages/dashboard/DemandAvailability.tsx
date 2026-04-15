import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { datasets } from "@/data/dataLoader";
import { chartTooltipProps } from "@/lib/chartStyles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function KPISimple({ title, value, subtitle, color, tooltip }: { title: string; value: string; subtitle?: string; color?: "red" | "green" | "amber"; tooltip?: string }) {
  const border = color === "red"
    ? "border-l-4 border-l-red-500"
    : color === "green"
      ? "border-l-4 border-l-emerald-500"
      : color === "amber"
        ? "border-l-4 border-l-amber-500"
        : "border-l-4 border-l-border";
  return (
    <Card className={cn("bg-gradient-card", border)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {title}
          {tooltip && (
            <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100" /></TooltipTrigger><TooltipContent className="max-w-xs text-xs"><p>{tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function DemandAvailability() {
  const LATEST_DATE = useMemo(() => datasets.demandSignals.reduce((max, r) => r.date > max ? r.date : max, ""), []);

  const skuNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.skuMaster.forEach((s) => { m[s.sku_id] = s.normalized_name; });
    return m;
  }, []);

  const shopsyLatest = useMemo(
    () => datasets.demandSignals.filter((r) => r.platform === "Shopsy" && r.date === LATEST_DATE),
    [LATEST_DATE]
  );

  /* ---- Section 1 KPIs ---- */
  const avgDemand = useMemo(() => avg(shopsyLatest.map((r) => r.demand_intensity_score)), [shopsyLatest]);
  const highDemandCount = useMemo(() => shopsyLatest.filter((r) => r.demand_intensity_score > 60).length, [shopsyLatest]);
  const criticalStockouts = useMemo(() => shopsyLatest.filter((r) => r.must_have_flag === 1 && r.stockout_flag === 1).length, [shopsyLatest]);
  const totalLostDemand = useMemo(() => shopsyLatest.reduce((s, r) => s + r.lost_demand_proxy, 0), [shopsyLatest]);

  /* ---- Section 2 Action Queue ---- */
  const promoteThese = useMemo(() =>
    shopsyLatest
      .filter((r) => r.availability_flag === 1 && r.demand_intensity_score > 60 && r.price_gap_pct > 5)
      .sort((a, b) => b.demand_intensity_score - a.demand_intensity_score)
      .slice(0, 10)
      .map((r) => ({ name: skuNameMap[r.sku_id] || r.sku_id, category: r.category, demand: r.demand_intensity_score, gap: r.price_gap_pct })),
    [shopsyLatest, skuNameMap]
  );

  const fixSupply = useMemo(() =>
    shopsyLatest
      .filter((r) => r.demand_intensity_score > 50 && r.stockout_freq_7d > 0.3)
      .sort((a, b) => b.demand_intensity_score - a.demand_intensity_score)
      .slice(0, 10)
      .map((r) => ({ name: skuNameMap[r.sku_id] || r.sku_id, category: r.category, stockout: r.stockout_freq_7d, demand: r.demand_intensity_score })),
    [shopsyLatest, skuNameMap]
  );

  const deprioritise = useMemo(() =>
    shopsyLatest
      .filter((r) => r.demand_intensity_score < 30 && r.discount_percent > 0)
      .sort((a, b) => a.demand_intensity_score - b.demand_intensity_score)
      .slice(0, 10)
      .map((r) => ({ name: skuNameMap[r.sku_id] || r.sku_id, category: r.category, demand: r.demand_intensity_score, discount: r.discount_percent })),
    [shopsyLatest, skuNameMap]
  );

  /* ---- Section 3 Stockout Heatmap ---- */
  const stockoutByCategory = useMemo(() => {
    const map: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    datasets.demandSignals
      .filter((r) => r.date === LATEST_DATE)
      .forEach((r) => {
        const e = (map[r.category] ??= { shopsy: [], meesho: [] });
        if (r.platform === "Shopsy") e.shopsy.push(r.stockout_freq_7d);
        if (r.platform === "Meesho") e.meesho.push(r.stockout_freq_7d);
      });
    return Object.entries(map)
      .map(([category, v]) => ({
        category,
        Shopsy: +(avg(v.shopsy) * 100).toFixed(1),
        Meesho: +(avg(v.meesho) * 100).toFixed(1),
      }))
      .sort((a, b) => b.Shopsy - a.Shopsy);
  }, [LATEST_DATE]);

  /* ---- Section 4 Availability Trend ---- */
  const availabilityTrend = useMemo(() => {
    const map: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    datasets.demandSignals.forEach((r) => {
      const e = (map[r.date] ??= { shopsy: [], meesho: [] });
      if (r.platform === "Shopsy") e.shopsy.push(r.availability_flag);
      if (r.platform === "Meesho") e.meesho.push(r.availability_flag);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: date.slice(5), // MM-DD
        Shopsy: +(avg(v.shopsy) * 100).toFixed(1),
        Meesho: +(avg(v.meesho) * 100).toFixed(1),
      }));
  }, []);

  /* ---- Section 5 Critical SKUs ---- */
  const criticalSKUs = useMemo(() =>
    shopsyLatest
      .filter((r) => r.must_have_flag === 1 && r.stockout_freq_7d > 0.2)
      .sort((a, b) => b.lost_demand_proxy - a.lost_demand_proxy)
      .slice(0, 20)
      .map((r) => ({
        name: skuNameMap[r.sku_id] || r.sku_id,
        brand: r.brand,
        category: r.category,
        stockout: r.stockout_freq_7d,
        demand: r.demand_intensity_score,
        lost: r.lost_demand_proxy,
      })),
    [shopsyLatest, skuNameMap]
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <h1 className="text-lg font-semibold">Demand &amp; Availability</h1>

      {/* Section 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPISimple title="Avg Demand Intensity Score" value={avgDemand.toFixed(1)} subtitle="Shopsy, latest" tooltip="Composite score (0–100) measuring how strongly a SKU is being demanded based on search rank, review velocity, and price sensitivity signals" />
        <KPISimple title="SKUs with High Demand (>60)" value={highDemandCount.toString()} color="green" tooltip="Count of Shopsy SKUs with demand intensity score above 60, where promotional investment would have measurable impact" />
        <KPISimple title="Critical Stockouts" value={criticalStockouts.toString()} subtitle="Must-have SKUs out of stock" color="red" tooltip="Must-have SKUs (flagged as portfolio-critical) that are currently out of stock on Shopsy" />
        <KPISimple title="Total Lost Demand Proxy" value={totalLostDemand.toFixed(0)} color="amber" tooltip="Estimated demand units lost across all Shopsy SKUs due to stockouts. Synthetic proxy — directional only" />
      </div>

      {/* Section 2 — Action Queue */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Column A */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Promote These</CardTitle>
            <p className="text-[10px] text-muted-foreground">High demand, in stock, overpriced</p>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[320px] overflow-y-auto">
            {promoteThese.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">None found</p> : promoteThese.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-1.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium tabular-nums">{r.demand.toFixed(1)}</p>
                  <p className="text-[10px] text-red-500 dark:text-red-400 tabular-nums">+{r.gap.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Column B */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fix Supply First</CardTitle>
            <p className="text-[10px] text-muted-foreground">High demand, frequent stockouts</p>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[320px] overflow-y-auto">
            {fixSupply.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">None found</p> : fixSupply.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-1.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium tabular-nums">{r.demand.toFixed(1)}</p>
                  <p className="text-[10px] text-amber-500 dark:text-amber-400 tabular-nums">{(r.stockout * 100).toFixed(1)}% OOS</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Column C */}
        <Card className="border-l-4 border-l-muted-foreground/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Deprioritise</CardTitle>
            <p className="text-[10px] text-muted-foreground">Low demand, currently discounted</p>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[320px] overflow-y-auto">
            {deprioritise.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">None found</p> : deprioritise.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-1.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-muted-foreground tabular-nums">{r.demand.toFixed(1)}</p>
                  <p className="text-[10px] tabular-nums">{r.discount.toFixed(1)}% off</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Section 3 — Stockout by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Stockout Frequency by Category</CardTitle>
          <p className="text-xs text-muted-foreground">Avg 7-day stockout rate (%), Shopsy vs Meesho, latest date</p>
        </CardHeader>
        <CardContent>
          {stockoutByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, stockoutByCategory.length * 34)}>
              <BarChart data={stockoutByCategory} layout="vertical" margin={{ left: 150, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
                <YAxis type="category" dataKey="category" width={140} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [`${v}%`, ""]} />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Availability Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Availability Trend (Apr 2026)</CardTitle>
          <p className="text-xs text-muted-foreground">Daily avg availability rate, Shopsy vs Meesho</p>
        </CardHeader>
        <CardContent>
          {availabilityTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={availabilityTrend} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tickFormatter={(v: number) => `${v}%`} fontSize={11} domain={[60, 100]} />
                <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [`${v}%`, ""]} />
                <Legend verticalAlign="top" height={28} />
                <Line type="monotone" dataKey="Shopsy" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Meesho" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Critical SKUs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Must-Have SKUs at Risk</CardTitle>
          <p className="text-xs text-muted-foreground">Fix supply before promoting &mdash; must-have SKUs with elevated stockout frequency</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Product Name", "Brand", "Category", "Stockout Freq (7d)", "Demand Score", "Lost Demand"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criticalSKUs.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No critical SKUs found.</td></tr>
              ) : criticalSKUs.map((r, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 max-w-[200px] truncate font-medium">{r.name}</td>
                  <td className="py-1.5 px-2">{r.brand}</td>
                  <td className="py-1.5 px-2">{r.category}</td>
                  <td className="py-1.5 px-2">
                    <Badge variant={r.stockout > 0.5 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 tabular-nums">
                      {(r.stockout * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-1.5 px-2 font-medium tabular-nums">{r.demand.toFixed(1)}</td>
                  <td className="py-1.5 px-2 font-medium text-red-600 dark:text-red-400 tabular-nums">{r.lost.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
