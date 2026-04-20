/**
 * PromotionBudgetOptimizer.tsx — v2.0 Category-First
 *
 * Layout:
 *   Section 1 — Budget input + Scenario A vs B split (two budget inputs, two outputs)
 *   Section 2 — Flagged subcategories imported from Pricing page (UI state via localStorage stub)
 *   Section 3 — ROI leaderboard table (all subcategories ranked)
 *   Section 4 — Promotion Calendar — 14-day timeline showing Meesho vs Shopsy promo activity
 *   Section 5 — Category GMV uplift potential bar chart
 *   Section 6 — Recommended promo type mix donut
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Flag, Calendar, Zap } from "lucide-react";
import { chartTooltipProps } from "@/lib/chartStyles";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  getPromotionROI,
  getPromoCalendarAll,
  getAllDates,
  datasets,
  PromotionROI,
  GenZSignalLevel,
  BudgetPriority,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",   "hsl(262, 83%, 58%)", "hsl(199, 89%, 48%)",
  "hsl(340, 82%, 52%)", "hsl(25, 95%, 53%)",  "hsl(173, 80%, 40%)",
  "hsl(47, 100%, 50%)",
];

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

function priorityBadge(p: BudgetPriority) {
  switch (p) {
    case "P1 — Act Now":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">P1 Act Now</Badge>;
    case "P2 — Consider":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">P2 Consider</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">P3 Monitor</Badge>;
  }
}

function promoBadge(type: string) {
  switch (type) {
    case "Flash Sale":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">🔥 Flash Sale</Badge>;
    case "Coupon":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">🎟 Coupon</Badge>;
    case "Bundle":
      return <Badge className="bg-violet-500/90 hover:bg-violet-500 text-white text-[10px] px-1.5 py-0">📦 Bundle</Badge>;
    default:
      return <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">🏷 {type}</Badge>;
  }
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
// ALLOCATION ENGINE
// Takes a budget in ₹ (treated as index units matching estimated_gmv_uplift scale)
// and greedily selects top ROI subcategories that fit
// ─────────────────────────────────────────────────────────────────────────────

interface AllocResult {
  rows: PromotionROI[];
  totalUplift: number;
  avgROI: number;
  subcatCount: number;
}

function allocate(budget: number, pool: PromotionROI[]): AllocResult {
  if (budget <= 0) return { rows: [], totalUplift: 0, avgROI: 0, subcatCount: 0 };
  let spent = 0;
  const result: PromotionROI[] = [];
  for (const r of pool) {
    // cost proxy: recommended_discount × avg price midpoint (relative units)
    const cost = r.recommended_discount * 10;
    if (spent + cost > budget) continue;
    result.push(r);
    spent += cost;
    if (spent >= budget) break;
  }
  const totalUplift = result.reduce((s, r) => s + (r.avg_subcategory_price_inr * r.estimated_monthly_orders), 0);
  const avgROI = result.length ? result.reduce((s, r) => s + r.promotion_roi_score, 0) / result.length : 0;
  return { rows: result, totalUplift, avgROI, subcatCount: result.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION TABLE
// ─────────────────────────────────────────────────────────────────────────────

function AllocTable({ rows, label }: { rows: PromotionROI[]; label: string }) {
  if (!rows.length) return (
    <p className="text-sm text-muted-foreground py-6 text-center">
      No subcategories fit within {label} budget.
    </p>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left py-2 pl-3 pr-2 font-medium text-muted-foreground">Subcategory</th>
            <th className="text-left py-2 pr-2 font-medium text-muted-foreground text-[10px]">Category</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">Gen Z</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">ROI Score</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">Promo Type</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">Discount</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">GMV Uplift</th>
            <th className="text-center py-2 pl-2 pr-3 font-medium text-muted-foreground">Priority</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.category}-${r.subcategory}`} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
              <td className="py-2 pl-3 pr-2 font-medium">{r.subcategory}</td>
              <td className="py-2 pr-2 text-muted-foreground text-[10px]">{r.category}</td>
              <td className="py-2 px-2 text-center">
                <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[r.genz_signal])}>
                  {GENZ_LABEL[r.genz_signal]}
                </span>
              </td>
              <td className="py-2 px-2 text-center font-bold tabular-nums">
                <span className={cn(
                  r.promotion_roi_score > 70 ? "text-emerald-600 dark:text-emerald-400" :
                  r.promotion_roi_score > 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}>
                  {fmt1(r.promotion_roi_score)}
                </span>
              </td>
              <td className="py-2 px-2 text-center">{promoBadge(r.recommended_promo_type)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{fmt1(r.recommended_discount)}%</td>
              <td className="py-2 px-2 text-center tabular-nums font-medium">{fmt1(r.avg_subcategory_price_inr * r.estimated_monthly_orders)}</td>
              <td className="py-2 pl-2 pr-3 text-center">{priorityBadge(r.budget_priority)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2 px-3 italic">
        GMV uplift is a relative index for prioritisation — not absolute ₹ revenue.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMO CALENDAR
// 14-day horizontal timeline showing promo activity per subcategory × platform
// ─────────────────────────────────────────────────────────────────────────────

function PromoCalendar() {
  const [calCat, setCalCat] = useState("All");
  const allDates    = getAllDates();
  const calendarRaw = useMemo(() => getPromoCalendarAll(), []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(calendarRaw.map((r) => r.category))).sort()],
    [calendarRaw]
  );

  // Build a matrix: subcategory × date → { shopsy: active, meesho: active, campaign }
  const subcats = useMemo(() => {
    const pool = calCat === "All" ? calendarRaw : calendarRaw.filter((r) => r.category === calCat);
    const keys = Array.from(new Set(pool.map((r) => `${r.category}||${r.subcategory}`))).sort();
    return keys.map((k) => {
      const [cat, sub] = k.split("||");
      return { category: cat, subcategory: sub };
    });
  }, [calendarRaw, calCat]);

  const matrixMap = useMemo(() => {
    const m: Record<string, Record<string, { shopsy: boolean; meesho: boolean; campaign: boolean }>> = {};
    calendarRaw.forEach((r) => {
      const key = `${r.category}||${r.subcategory}`;
      if (!m[key]) m[key] = {};
      if (!m[key][r.date]) m[key][r.date] = { shopsy: false, meesho: false, campaign: false };
      if (r.platform === "Shopsy" && r.promo_active === 1) m[key][r.date].shopsy = true;
      if (r.platform === "Meesho" && r.promo_active === 1) m[key][r.date].meesho = true;
      if (r.is_campaign_event === 1) m[key][r.date].campaign = true;
    });
    return m;
  }, [calendarRaw]);

  const displayedSubcats = subcats.slice(0, 20);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          14-Day Promotion Calendar
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Promo activity per subcategory — Shopsy vs Meesho.
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400" /> Shopsy
          </span>
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Meesho
          </span>
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Meesho campaign (Shopsy silent)
          </span>
        </p>
      </CardHeader>

      {/* Category filter */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full h-6 text-[10px] px-2.5",
              calCat === cat
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
            onClick={() => setCalCat(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <CardContent className="p-0 pb-4 overflow-x-auto">
        <table className="text-[10px] border-collapse" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground sticky left-0 bg-background z-10 border-b border-border min-w-[180px]">
                Subcategory
              </th>
              {allDates.map((d) => (
                <th key={d} className="text-center px-1 py-2 font-medium text-muted-foreground border-b border-border min-w-[36px]">
                  {d.slice(8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedSubcats.length === 0 ? (
              <tr>
                <td colSpan={allDates.length + 1} className="py-6 text-center text-muted-foreground">
                  No promo calendar data loaded yet.
                </td>
              </tr>
            ) : (
              displayedSubcats.map(({ category, subcategory }) => {
                const key = `${category}||${subcategory}`;
                const row = matrixMap[key] ?? {};
                return (
                  <tr key={key} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="px-3 py-1.5 sticky left-0 bg-background z-10 font-medium">
                      <span className="truncate block max-w-[170px]">{subcategory}</span>
                      <span className="text-[9px] text-muted-foreground">{category}</span>
                    </td>
                    {allDates.map((d) => {
                      const cell = row[d];
                      const shopsy   = cell?.shopsy ?? false;
                      const meesho   = cell?.meesho ?? false;
                      const campaign = cell?.campaign ?? false;
                      // Unanswered: Meesho active campaign, Shopsy silent
                      const unanswered = campaign && meesho && !shopsy;

                      return (
                        <td key={d} className="px-1 py-1.5 text-center">
                          {unanswered ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-5 h-5 rounded-sm bg-red-500 mx-auto cursor-help flex items-center justify-center">
                                    <Zap className="h-2.5 w-2.5 text-white" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Meesho campaign active — Shopsy not responding</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : shopsy && meesho ? (
                            <div className="w-5 h-5 rounded-sm bg-violet-400 mx-auto" title="Both promoting" />
                          ) : shopsy ? (
                            <div className="w-5 h-5 rounded-sm bg-blue-400 mx-auto" title="Shopsy promoting" />
                          ) : meesho ? (
                            <div className="w-5 h-5 rounded-sm bg-amber-400 mx-auto" title="Meesho promoting" />
                          ) : (
                            <div className="w-5 h-5 rounded-sm bg-muted mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {subcats.length > 20 && (
          <p className="text-[10px] text-muted-foreground px-3 pt-2">
            Showing 20 of {subcats.length} subcategories. Filter by category to focus.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PromotionBudgetOptimizer() {
  const [budgetA, setBudgetA] = useState("300");
  const [budgetB, setBudgetB] = useState("500");
  const [scenarioRun, setScenarioRun] = useState(false);
  const [p1Only, setP1Only] = useState(false);

  const allROI = useMemo(() => getPromotionROI(), []);

  const pool = useMemo(
    () => p1Only ? allROI.filter((r) => r.budget_priority === "P1 — Act Now") : allROI,
    [allROI, p1Only]
  );

  // Scenario results
  const scenA = useMemo(
    () => scenarioRun ? allocate(parseFloat(budgetA) || 0, pool) : null,
    [scenarioRun, budgetA, pool]
  );
  const scenB = useMemo(
    () => scenarioRun ? allocate(parseFloat(budgetB) || 0, pool) : null,
    [scenarioRun, budgetB, pool]
  );

  // Category GMV uplift chart
  const categoryUpliftData = useMemo(() => {
    const catMap: Record<string, number> = {};
    allROI.forEach((r) => { catMap[r.category] = (catMap[r.category] ?? 0) + (r.avg_subcategory_price_inr * r.estimated_monthly_orders); });
    return Object.entries(catMap)
      .map(([category, uplift]) => ({ category, uplift: +uplift.toFixed(1) }))
      .sort((a, b) => b.uplift - a.uplift);
  }, [allROI]);

  // Promo type mix
  const promoTypeMix = useMemo(() => {
    const typeMap: Record<string, number> = {};
    allROI.forEach((r) => { typeMap[r.recommended_promo_type] = (typeMap[r.recommended_promo_type] ?? 0) + 1; });
    return Object.entries(typeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allROI]);

  const p1Count = allROI.filter((r) => r.budget_priority === "P1 — Act Now").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold">Promotion Budget Optimizer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          ROI-ranked subcategories · Scenario comparison · 14-day promotion calendar
        </p>
      </div>

      {/* ── Section 1 — Scenario A vs B ──────────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Scenario Comparison
        </p>
        <Card className="border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Where should Shopsy spend?</CardTitle>
            <p className="text-xs text-muted-foreground">
              Compare two budget levels side by side. The optimizer ranks subcategories by ROI score and greedily allocates budget to the highest-return subcategories first.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Scenario A — Budget (index units)</label>
                <Input
                  type="number"
                  value={budgetA}
                  onChange={(e) => setBudgetA(e.target.value)}
                  className="h-9 w-full"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Scenario B — Budget (index units)</label>
                <Input
                  type="number"
                  value={budgetB}
                  onChange={(e) => setBudgetB(e.target.value)}
                  className="h-9 w-full"
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={() => setScenarioRun(true)}
                className="h-9 px-6 font-semibold"
              >
                Run Scenarios
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={p1Only}
                  onChange={(e) => setP1Only(e.target.checked)}
                  className="rounded"
                />
                P1 opportunities only ({p1Count} subcategories)
              </label>
              {scenarioRun && (
                <Button variant="ghost" size="sm" onClick={() => setScenarioRun(false)} className="text-xs">
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario results */}
        {scenarioRun && scenA && scenB && (
          <>
            {/* Summary comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <KPICard
                title="Scenario A — Subcategories"
                value={String(scenA.subcatCount)}
                color="green"
                tooltip="Number of subcategories that fit within Scenario A budget."
              />
              <KPICard
                title="Scenario A — GMV Uplift"
                value={fmt1(scenA.totalUplift)}
                subtitle="relative index"
                color="green"
                tooltip="Total GMV uplift index for Scenario A allocation."
              />
              <KPICard
                title="Scenario B — Subcategories"
                value={String(scenB.subcatCount)}
                color="amber"
                tooltip="Number of subcategories that fit within Scenario B budget."
              />
              <KPICard
                title="Scenario B — GMV Uplift"
                value={fmt1(scenB.totalUplift)}
                subtitle="relative index"
                color="amber"
                tooltip="Total GMV uplift index for Scenario B allocation."
              />
            </div>

            {/* Side-by-side allocation tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <Card className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Scenario A — Budget {budgetA} · {scenA.subcatCount} subcategories · Avg ROI {fmt1(scenA.avgROI)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <AllocTable rows={scenA.rows} label={`A (${budgetA})`} />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Scenario B — Budget {budgetB} · {scenB.subcatCount} subcategories · Avg ROI {fmt1(scenB.avgROI)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <AllocTable rows={scenB.rows} label={`B (${budgetB})`} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>

      {/* ── Section 2 — Full ROI Leaderboard ────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          ROI Leaderboard — All Subcategories
        </p>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subcategory Promotion ROI Ranking</CardTitle>
            <p className="text-xs text-muted-foreground">
              Composite score (0–100): price gap pressure 30% + Meesho promo intensity 25% + Gen Z signal 25% + Shopsy availability 20%.
              Sorted by ROI score descending.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-2 overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
                    <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground w-[170px]">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            ROI Score <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Composite score 0–100. Higher = better expected return per promotional ₹ spent.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Price Gap</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Meesho Promo</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Shopsy Avail.</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Rec. Promo</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Disc. %</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">GMV Uplift</th>
                    <th className="text-center py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {allROI.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-muted-foreground">
                        No ROI data loaded yet.
                      </td>
                    </tr>
                  ) : (
                    allROI.map((r) => (
                      <tr
                        key={`${r.category}-${r.subcategory}`}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 font-medium">{r.subcategory}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{r.category}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[r.genz_signal])}>
                            {GENZ_LABEL[r.genz_signal]}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "inline-block rounded px-2 py-0.5 text-xs font-bold tabular-nums",
                            r.promotion_roi_score > 70
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : r.promotion_roi_score > 50
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {fmt1(r.promotion_roi_score)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                          {r.avg_price_gap_pct > 0 ? "+" : ""}{fmt1(r.avg_price_gap_pct)}%
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                          {(r.meesho_promo_rate * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                          {(r.shopsy_availability * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-2 text-center">{promoBadge(r.recommended_promo_type)}</td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-xs">{fmt1(r.recommended_discount)}%</td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-xs font-medium">{fmt1(r.avg_subcategory_price_inr * r.estimated_monthly_orders)}</td>
                        <td className="py-2.5 pl-2 pr-4 text-center">{priorityBadge(r.budget_priority)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Section 3 — Promo Calendar ───────────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Promotion Calendar
        </p>
        <PromoCalendar />
      </section>

      {/* ── Section 4 — Category GMV + Promo Mix ─────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GMV Uplift Potential by Category</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sum of estimated GMV uplift index across all subcategories per category
            </p>
          </CardHeader>
          <CardContent>
            {categoryUpliftData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, categoryUpliftData.length * 34)}>
                <BarChart
                  data={categoryUpliftData}
                  layout="vertical"
                  margin={{ left: 160, right: 50, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={150}
                    fontSize={11}
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <RechartsTooltip
                    {...chartTooltipProps}
                    formatter={(v: number) => [fmt1(v), "GMV Uplift Index"]}
                  />
                  <Bar dataKey="uplift" radius={[0, 4, 4, 0]}>
                    {categoryUpliftData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="uplift"
                      position="right"
                      fontSize={10}
                      formatter={(v: number) => fmt1(v)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended Promo Mix</CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribution of recommended promo types across all ROI-ranked subcategories
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            {promoTypeMix.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={promoTypeMix}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    fontSize={10}
                  >
                    {promoTypeMix.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [v, "Subcategories"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
