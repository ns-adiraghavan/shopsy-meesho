/**
 * DemandAvailability.tsx — v2.0 Category-First
 *
 * Layout:
 *   Section 1 — 4 KPI cards
 *   Section 2 — Action queue: 3 columns (Promote, Fix Supply, Monitor)
 *   Section 3 — Availability trend line chart (14-day, Shopsy vs Meesho)
 *   Section 4 — Stockout risk by category bar chart (Shopsy vs Meesho)
 *   Section 5 — Subcategory demand table with 7-day trend direction
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  LabelList,
} from "recharts";
import {
  getDemandLatest,
  getAvailabilityTrend,
  getAvailabilityTrendDirection,
  getLatestDate,
  getAllDates,
  datasets,
  GenZSignalLevel,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt1 = (n: number) => n.toFixed(1);

const GENZ_PILL: Record<GenZSignalLevel, string> = {
  very_high: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  high:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  moderate:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  low:       "bg-muted text-muted-foreground",
};

const GENZ_LABEL: Record<GenZSignalLevel, string> = {
  very_high: "Very High", high: "High", moderate: "Moderate", low: "Low",
};

function actionFlagBadge(flag: string) {
  switch (flag) {
    case "Act Now":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Act Now</Badge>;
    case "Monitor":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">Monitor</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Hold</Badge>;
  }
}

function TrendIcon({ direction }: { direction: number }) {
  if (direction > 0) return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
  if (direction < 0) return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({
  title, value, subtitle, color, tooltip,
}: {
  title: string; value: string; subtitle?: string;
  color?: "red" | "green" | "amber"; tooltip?: string;
}) {
  const border =
    color === "red"   ? "border-l-4 border-l-red-500" :
    color === "green" ? "border-l-4 border-l-emerald-500" :
    color === "amber" ? "border-l-4 border-l-amber-500" :
                        "border-l-4 border-l-border";
  return (
    <Card className={cn("bg-gradient-card", border)}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {title}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs"><p>{tooltip}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DemandAvailability() {
  const [catFilter, setCatFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState<"Both" | "Shopsy" | "Meesho">("Both");
  const [showAllPromote, setShowAllPromote] = useState(false);
  const [showAllFix, setShowAllFix]         = useState(false);
  const [showAllHold, setShowAllHold]       = useState(false);
  const [showAllTable, setShowAllTable]     = useState(false);

  const ACTION_PREVIEW = 5;
  const TABLE_PREVIEW  = 10;

  const latestDate = getLatestDate();
  const allDates   = getAllDates();

  // Latest demand for both platforms
  const demandAll    = useMemo(() => getDemandLatest(), [latestDate]);
  const demandShopsy = useMemo(() => getDemandLatest("Shopsy"), [latestDate]);
  const demandMeesho = useMemo(() => getDemandLatest("Meesho"), [latestDate]);

  // Category filter list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(demandAll.map((r) => r.category))).sort()],
    [demandAll]
  );

  // Filtered demand rows for the table
  const displayRows = useMemo(() => {
    let rows = platformFilter === "Both"
      ? demandAll
      : platformFilter === "Shopsy" ? demandShopsy : demandMeesho;
    if (catFilter !== "All") rows = rows.filter((r) => r.category === catFilter);
    return [...rows].sort((a, b) => b.demand_score - a.demand_score);
  }, [demandAll, demandShopsy, demandMeesho, catFilter, platformFilter]);

  // KPIs — Shopsy view
  const avgDemandShopsy = useMemo(() => {
    if (!demandShopsy.length) return 0;
    return demandShopsy.reduce((s, r) => s + r.demand_score, 0) / demandShopsy.length;
  }, [demandShopsy]);

  const actNowCount = useMemo(
    () => demandShopsy.filter((r) => r.action_flag === "Act Now").length,
    [demandShopsy]
  );

  const highStockoutCount = useMemo(
    () => demandShopsy.filter((r) => r.stockout_risk > 0.15).length,
    [demandShopsy]
  );

  const totalLostDemand = useMemo(
    () => demandShopsy.reduce((s, r) => s + r.lost_demand_index, 0),
    [demandShopsy]
  );

  // Section 2 — Action queues
  const promoteThese = useMemo(() =>
    demandShopsy
      .filter((r) => r.demand_score > 65 && r.stockout_risk < 0.15)
      .sort((a, b) => b.demand_score - a.demand_score)
      .slice(0, 8),
    [demandShopsy]
  );

  const fixSupply = useMemo(() =>
    demandShopsy
      .filter((r) => r.demand_score > 50 && r.stockout_risk > 0.15)
      .sort((a, b) => b.lost_demand_index - a.lost_demand_index)
      .slice(0, 8),
    [demandShopsy]
  );

  const hold = useMemo(() =>
    demandShopsy
      .filter((r) => r.demand_score < 40)
      .sort((a, b) => a.demand_score - b.demand_score)
      .slice(0, 8),
    [demandShopsy]
  );

  // Section 3 — Availability trend (avg across all subcategories per date)
  const availTrendData = useMemo(() => {
    return allDates.map((date) => {
      const sRows = datasets.categoryAvailability.filter(
        (r) => r.date === date && r.platform === "Shopsy"
      );
      const mRows = datasets.categoryAvailability.filter(
        (r) => r.date === date && r.platform === "Meesho"
      );
      const sAvg = sRows.length ? sRows.reduce((s, r) => s + r.availability_rate, 0) / sRows.length : null;
      const mAvg = mRows.length ? mRows.reduce((s, r) => s + r.availability_rate, 0) / mRows.length : null;
      return {
        date: date.slice(5),           // "MM-DD"
        Shopsy: sAvg !== null ? +(sAvg * 100).toFixed(1) : null,
        Meesho: mAvg !== null ? +(mAvg * 100).toFixed(1) : null,
      };
    });
  }, [allDates]);

  // Section 4 — Stockout risk by category
  const stockoutByCategory = useMemo(() => {
    const catMap: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    demandAll.forEach((r) => {
      const entry = (catMap[r.category] ??= { shopsy: [], meesho: [] });
      if (r.platform === "Shopsy") entry.shopsy.push(r.stockout_risk * 100);
      else entry.meesho.push(r.stockout_risk * 100);
    });
    return Object.entries(catMap)
      .map(([category, v]) => ({
        category,
        Shopsy: v.shopsy.length ? +(v.shopsy.reduce((a, b) => a + b, 0) / v.shopsy.length).toFixed(1) : 0,
        Meesho: v.meesho.length ? +(v.meesho.reduce((a, b) => a + b, 0) / v.meesho.length).toFixed(1) : 0,
      }))
      .sort((a, b) => b.Shopsy - a.Shopsy);
  }, [demandAll]);

  // 7-day trend direction per subcategory × platform (for table)
  const trendDirections = useMemo(() => {
    const map: Record<string, number> = {};
    displayRows.forEach((r) => {
      const key = `${r.category}||${r.subcategory}||${r.platform}`;
      map[key] = getAvailabilityTrendDirection(r.category, r.subcategory, r.platform);
    });
    return map;
  }, [displayRows]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold">Demand &amp; Availability</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Subcategory-level demand intensity, stockout risk, and 7-day availability trends
        </p>
      </div>

      {/* ── Section 1 — KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Demand Pressure (Shopsy)"
          value={fmt1(avgDemandShopsy)}
          subtitle="avg across subcategories"
          color={avgDemandShopsy > 65 ? "green" : "amber"}
          tooltip="How intensely consumers are seeking Shopsy products right now — driven by Gen Z engagement, rising search rank, and stockout patterns. Above 65 = strong promotional candidate."
        />
        <KPICard
          title="Act Now Subcategories"
          value={String(actNowCount)}
          subtitle="high demand + high stockout"
          color="red"
          tooltip="Subcategories where demand score > 75 and stockout risk > 15% — requiring immediate supply or promotional action."
        />
        <KPICard
          title="Elevated Stockout Risk"
          value={String(highStockoutCount)}
          subtitle="stockout risk > 15%"
          color="amber"
          tooltip="Shopsy subcategories where the stockout rate exceeds 15% on the latest date."
        />
        <KPICard
          title="Demand Exceeds Supply"
          value={String(demandShopsy.filter((r) => r.demand_score > 55 && r.stockout_risk > 0.15).length)}
          subtitle="subcategories: high demand, low stock"
          color={totalLostDemand > 500 ? "red" : "amber"}
          tooltip="Subcategories where consumer demand is strong but Shopsy availability is under pressure — the most urgent replenishment candidates."
        />
      </div>

      {/* ── Section 2 — Action Queue ──────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Action Queue — Shopsy
        </p>
        <div className="grid md:grid-cols-3 gap-4">

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Promote These</CardTitle>
              <p className="text-[10px] text-muted-foreground">High demand · supply available · ready to push</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {promoteThese.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None found</p>
              ) : (showAllPromote ? promoteThese : promoteThese.slice(0, ACTION_PREVIEW)).map((r) => (
                <div key={`${r.category}-${r.subcategory}`} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.subcategory}</p>
                    <p className="text-[10px] text-muted-foreground">{r.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt1(r.demand_score)}</p>
                    <p className="text-[10px] text-muted-foreground">{(r.stockout_risk * 100).toFixed(1)}% OOS</p>
                  </div>
                </div>
              ))}
              {promoteThese.length > ACTION_PREVIEW && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-0" onClick={() => setShowAllPromote(v => !v)}>
                  {showAllPromote ? "Show fewer" : `+${promoteThese.length - ACTION_PREVIEW} more`}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fix Supply First</CardTitle>
              <p className="text-[10px] text-muted-foreground">High demand · high stockout · promoting will waste spend</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {fixSupply.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None found</p>
              ) : (showAllFix ? fixSupply : fixSupply.slice(0, ACTION_PREVIEW)).map((r) => (
                <div key={`${r.category}-${r.subcategory}`} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.subcategory}</p>
                    <p className="text-[10px] text-muted-foreground">{r.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{fmt1(r.demand_score)}</p>
                    <p className="text-[10px] text-red-500 dark:text-red-400 tabular-nums">{(r.stockout_risk * 100).toFixed(1)}% OOS</p>
                  </div>
                </div>
              ))}
              {fixSupply.length > ACTION_PREVIEW && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-0" onClick={() => setShowAllFix(v => !v)}>
                  {showAllFix ? "Show fewer" : `+${fixSupply.length - ACTION_PREVIEW} more`}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-muted-foreground/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hold</CardTitle>
              <p className="text-[10px] text-muted-foreground">Low demand · conserve budget</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {hold.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None found</p>
              ) : (showAllHold ? hold : hold.slice(0, ACTION_PREVIEW)).map((r) => (
                <div key={`${r.category}-${r.subcategory}`} className="flex items-start justify-between gap-2 text-xs border-b border-border/30 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.subcategory}</p>
                    <p className="text-[10px] text-muted-foreground">{r.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums text-muted-foreground">{fmt1(r.demand_score)}</p>
                    <p className="text-[10px] text-muted-foreground">{(r.stockout_risk * 100).toFixed(1)}% OOS</p>
                  </div>
                </div>
              ))}
              {hold.length > ACTION_PREVIEW && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-0" onClick={() => setShowAllHold(v => !v)}>
                  {showAllHold ? "Show fewer" : `+${hold.length - ACTION_PREVIEW} more`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 3 — Availability Trend ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Availability Trend — Apr 2026</CardTitle>
          <p className="text-xs text-muted-foreground">
            Daily avg in-stock rate across all subcategories — Shopsy vs Meesho
          </p>
        </CardHeader>
        <CardContent>
          {availTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={availTrendData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tickFormatter={(v: number) => `${v}%`}
                  fontSize={11}
                  domain={[75, 95]}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <RechartsTooltip
                  {...chartTooltipProps}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
                <Legend verticalAlign="top" height={28} />
                <Line
                  type="monotone"
                  dataKey="Shopsy"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Meesho"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No availability data.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4 — Stockout by Category ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Stockout Risk by Category</CardTitle>
          <p className="text-xs text-muted-foreground">
            Avg stockout rate (%) per category — Shopsy vs Meesho, latest date. Higher = more supply risk.
          </p>
        </CardHeader>
        <CardContent>
          {stockoutByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, stockoutByCategory.length * 34)}>
              <BarChart
                data={stockoutByCategory}
                layout="vertical"
                margin={{ left: 160, right: 40, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={150}
                  fontSize={11}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <RechartsTooltip
                  {...chartTooltipProps}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Shopsy" position="right" fontSize={10} formatter={(v: number) => `${v}%`} />
                </Bar>
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Meesho" position="right" fontSize={10} formatter={(v: number) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5 — Subcategory Demand Table ─────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Subcategory Detail
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Category pills */}
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full h-7 text-xs px-3",
                catFilter === cat
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </Button>
          ))}
          {/* Platform pills */}
          <div className="flex gap-1.5 ml-2 border-l border-border pl-2">
            {(["Both", "Shopsy", "Meesho"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full h-7 text-xs px-3",
                  platformFilter === p
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
                onClick={() => setPlatformFilter(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demand &amp; Availability by Subcategory</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sorted by demand score descending. Trend = 14-day availability direction (↑ deteriorating, ↓ improving).
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-2 overflow-x-auto">
            <div>
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
                    <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground w-[160px]">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Platform</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Demand <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[220px]">
                            <p className="text-xs">How strongly consumers are seeking this subcategory. Above 75 = high urgency to promote (if stock is healthy) or replenish (if OOS is elevated).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Stockout %</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Avail. Trend <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">14-day direction of availability rate. ↑ = deteriorating (more OOS), ↓ = improving.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Missed Demand <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[220px]">
                            <p className="text-xs">Directional signal for unmet demand — higher means more consumers are likely not finding stock. Not a revenue figure; use for prioritisation only.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        No demand data loaded yet.
                      </td>
                    </tr>
                  ) : (
                    (showAllTable ? displayRows : displayRows.slice(0, TABLE_PREVIEW)).map((row) => {
                      const trendKey = `${row.category}||${row.subcategory}||${row.platform}`;
                      const trendDir = trendDirections[trendKey] ?? 0;
                      return (
                        <tr
                          key={trendKey}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2.5 pl-4 pr-2 font-medium">{row.subcategory}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{row.category}</td>
                          <td className="py-2.5 px-2 text-center">
                            <Badge
                              variant={row.platform === "Shopsy" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {row.platform}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal])}>
                              {GENZ_LABEL[row.genz_signal]}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums",
                              row.demand_score > 75
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : row.demand_score > 55
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                            )}>
                              {fmt1(row.demand_score)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums",
                              row.stockout_risk > 0.20
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : row.stockout_risk > 0.12
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                            )}>
                              {(row.stockout_risk * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center">
                              {/* For availability: ↑ stockout trending up = bad = red icon */}
                              <TrendIcon direction={trendDir} />
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center tabular-nums text-xs font-medium">
                            {fmt1(row.lost_demand_index)}
                          </td>
                          <td className="py-2.5 pl-2 pr-4 text-center">
                            {actionFlagBadge(row.action_flag)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {displayRows.length > TABLE_PREVIEW && (
              <div className="px-4 pt-3 pb-1">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAllTable(v => !v)}>
                  {showAllTable ? "Show fewer" : `Show all ${displayRows.length} subcategories`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
