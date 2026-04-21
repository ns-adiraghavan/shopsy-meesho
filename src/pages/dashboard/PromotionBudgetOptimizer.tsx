/**
 * PromotionBudgetOptimizer.tsx — v3.0
 *
 * Changes from v2:
 *   - GMV Uplift index removed everywhere (column, KPI cards, bar chart)
 *   - Scenario KPI cards now show Avg ROI Score + Subcategories Covered
 *   - ROI Leaderboard renamed "Subcategory Priority Queue"
 *   - Score description is plain English, not a formula
 *   - Each leaderboard row has an inline "Why?" expander showing 4 component signals
 *   - Table collapsed to 8 rows by default, "Show all" toggle
 *   - Category bar chart shows avg ROI score per category, not GMV index sum
 *   - Budget inputs labelled in Rs Lakhs (relative, not index units)
 *   - Promo Calendar collapsed to 15 rows by default with Show all toggle
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Calendar, Zap, ChevronDown, ChevronRight } from "lucide-react";
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
// CONSTANTS
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

const DEFAULT_TABLE_ROWS = 8;
const DEFAULT_CAL_ROWS   = 15;

// ─────────────────────────────────────────────────────────────────────────────
// BADGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Flash Sale</Badge>;
    case "Coupon":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">Coupon</Badge>;
    case "Bundle":
      return <Badge className="bg-violet-500/90 hover:bg-violet-500 text-white text-[10px] px-1.5 py-0">Bundle</Badge>;
    default:
      return <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">{type}</Badge>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHY SUMMARY — plain-English explanation of score drivers
// ─────────────────────────────────────────────────────────────────────────────

function buildWhySummary(r: PromotionROI): string {
  const parts: string[] = [];

  if (r.avg_price_gap_pct > 8)
    parts.push(`Shopsy is priced ${fmt1(r.avg_price_gap_pct)}% above Meesho — strong case to close the gap`);
  else if (r.avg_price_gap_pct > 0)
    parts.push(`Shopsy is ${fmt1(r.avg_price_gap_pct)}% more expensive than Meesho`);
  else
    parts.push(`Shopsy is price-competitive (${fmt1(Math.abs(r.avg_price_gap_pct))}% below Meesho)`);

  const promoRate = Math.round(r.meesho_promo_rate * 100);
  if (promoRate >= 60)
    parts.push(`Meesho is promoting aggressively (${promoRate}% of days active)`);
  else if (promoRate >= 30)
    parts.push(`Meesho is promoting on ${promoRate}% of days`);
  else
    parts.push(`Meesho promo pressure is low (${promoRate}% of days)`);

  parts.push(`Gen Z signal: ${GENZ_LABEL[r.genz_signal]}`);

  const avail = Math.round(r.shopsy_availability * 100);
  if (avail >= 85)
    parts.push(`Shopsy availability is healthy (${avail}%) — ready to absorb promotional traffic`);
  else if (avail >= 75)
    parts.push(`Shopsy availability is moderate (${avail}%) — some stockout risk during a promotion`);
  else
    parts.push(`Shopsy availability is low (${avail}%) — resolve stock before promoting`);

  return parts.join(" · ");
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
// ─────────────────────────────────────────────────────────────────────────────

interface AllocResult {
  rows: PromotionROI[];
  avgROI: number;
  subcatCount: number;
}

function allocate(budget: number, pool: PromotionROI[]): AllocResult {
  if (budget <= 0) return { rows: [], avgROI: 0, subcatCount: 0 };
  let spent = 0;
  const result: PromotionROI[] = [];
  for (const r of pool) {
    const cost = r.estimated_promo_cost_cr;
    if (spent + cost > budget) continue;
    result.push(r);
    spent += cost;
    if (spent >= budget) break;
  }
  const avgROI = result.length
    ? result.reduce((s, r) => s + r.promotion_roi_score, 0) / result.length
    : 0;
  return { rows: result, avgROI, subcatCount: result.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION TABLE (compact — used inside scenario cards)
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
              <td className="py-2 pl-2 pr-3 text-center">{priorityBadge(r.budget_priority)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY QUEUE TABLE — full leaderboard with inline Why? expander
// ─────────────────────────────────────────────────────────────────────────────

function PriorityQueueTable({ rows }: { rows: PromotionROI[] }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? rows : rows.slice(0, DEFAULT_TABLE_ROWS);

  function toggleRow(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  if (!rows.length) return (
    <p className="text-sm text-muted-foreground text-center py-8">No ROI data loaded yet.</p>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
              {/* chevron col */}
              <th className="w-6 py-2.5 pl-4" />
              <th className="text-left py-2.5 pr-2 font-medium text-muted-foreground w-[160px]">Subcategory</th>
              <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 mx-auto cursor-default">
                      ROI Score <HelpCircle className="h-3 w-3 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[260px]">
                      <p className="text-xs">
                        How strongly we recommend promoting this subcategory now — based on Shopsy's
                        price gap vs Meesho, Meesho's promo intensity, Gen Z demand, and Shopsy's
                        stock position. Click any row for the plain-English reasoning.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Price Gap</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Meesho Promo</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Shopsy Avail.</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Rec. Promo</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Disc. %</th>
              <th className="text-center py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((r) => {
              const key = `${r.category}-${r.subcategory}`;
              const isOpen = expandedKey === key;
              return (
                <>
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer select-none",
                      isOpen && "bg-muted/30 border-border/60"
                    )}
                    onClick={() => toggleRow(key)}
                  >
                    <td className="py-2.5 pl-4 pr-1 text-muted-foreground">
                      {isOpen
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </td>
                    <td className="py-2.5 pr-2 font-medium">{r.subcategory}</td>
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
                    <td className={cn(
                      "py-2.5 px-2 text-center tabular-nums text-xs font-medium",
                      r.avg_price_gap_pct > 8  ? "text-red-600 dark:text-red-400" :
                      r.avg_price_gap_pct > 0  ? "text-amber-600 dark:text-amber-400" :
                                                  "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {r.avg_price_gap_pct > 0 ? "+" : ""}{fmt1(r.avg_price_gap_pct)}%
                    </td>
                    <td className="py-2.5 px-2 text-center tabular-nums text-xs">
                      {(r.meesho_promo_rate * 100).toFixed(0)}%
                    </td>
                    <td className={cn(
                      "py-2.5 px-2 text-center tabular-nums text-xs",
                      r.shopsy_availability < 0.75 ? "text-red-600 dark:text-red-400" :
                      r.shopsy_availability < 0.85 ? "text-amber-600 dark:text-amber-400" : ""
                    )}>
                      {(r.shopsy_availability * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-2 text-center">{promoBadge(r.recommended_promo_type)}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums text-xs">{fmt1(r.recommended_discount)}%</td>
                    <td className="py-2.5 pl-2 pr-4 text-center">{priorityBadge(r.budget_priority)}</td>
                  </tr>

                  {isOpen && (
                    <tr key={`${key}-why`} className="border-b border-border/40 bg-muted/20">
                      <td colSpan={11} className="px-8 py-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">Why this ranking? </span>
                          {buildWhySummary(r)}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > DEFAULT_TABLE_ROWS && (
        <div className="px-4 pt-3 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show fewer" : `Show all ${rows.length} subcategories`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMO CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

function PromoCalendar() {
  const [calCat, setCalCat]       = useState("All");
  const [calShowAll, setCalShowAll] = useState(false);

  const allDates    = getAllDates();
  const calendarRaw = useMemo(() => getPromoCalendarAll(), []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(calendarRaw.map((r) => r.category))).sort()],
    [calendarRaw]
  );

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

  const displayed = calShowAll ? subcats : subcats.slice(0, DEFAULT_CAL_ROWS);

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
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Meesho campaign — Shopsy silent
          </span>
        </p>
      </CardHeader>

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
            onClick={() => { setCalCat(cat); setCalShowAll(false); }}
          >
            {cat}
          </Button>
        ))}
      </div>

      <CardContent className="p-0 pb-2 overflow-x-auto">
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
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={allDates.length + 1} className="py-6 text-center text-muted-foreground">
                  No promo calendar data loaded.
                </td>
              </tr>
            ) : (
              displayed.map(({ category, subcategory }) => {
                const key  = `${category}||${subcategory}`;
                const row  = matrixMap[key] ?? {};
                return (
                  <tr key={key} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="px-3 py-1.5 sticky left-0 bg-background z-10 font-medium">
                      <span className="truncate block max-w-[170px]">{subcategory}</span>
                      <span className="text-[9px] text-muted-foreground">{category}</span>
                    </td>
                    {allDates.map((d) => {
                      const cell       = row[d];
                      const shopsy     = cell?.shopsy   ?? false;
                      const meesho     = cell?.meesho   ?? false;
                      const campaign   = cell?.campaign ?? false;
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

        {subcats.length > DEFAULT_CAL_ROWS && (
          <div className="px-3 pt-2 pb-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] text-muted-foreground h-6"
              onClick={() => setCalShowAll((v) => !v)}
            >
              {calShowAll ? "Show fewer" : `Show all ${subcats.length} subcategories`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PromotionBudgetOptimizer() {
  const [budgetA, setBudgetA]       = useState("3");   // was "300"
  const [budgetB, setBudgetB]       = useState("6");   // was "500"
  const [scenarioRun, setScenarioRun] = useState(false);
  const [p1Only, setP1Only]         = useState(false);

  const allROI = useMemo(() => getPromotionROI(), []);

  const pool = useMemo(
    () => p1Only ? allROI.filter((r) => r.budget_priority === "P1 — Act Now") : allROI,
    [allROI, p1Only]
  );

  const scenA = useMemo(
    () => scenarioRun ? allocate(parseFloat(budgetA) || 0, pool) : null,
    [scenarioRun, budgetA, pool]
  );
  const scenB = useMemo(
    () => scenarioRun ? allocate(parseFloat(budgetB) || 0, pool) : null,
    [scenarioRun, budgetB, pool]
  );

  // Category avg ROI score (replaces GMV index sum)
  const categoryROIData = useMemo(() => {
    const catMap: Record<string, { total: number; count: number }> = {};
    allROI.forEach((r) => {
      if (!catMap[r.category]) catMap[r.category] = { total: 0, count: 0 };
      catMap[r.category].total += r.promotion_roi_score;
      catMap[r.category].count += 1;
    });
    return Object.entries(catMap)
      .map(([category, { total, count }]) => ({
        category,
        avgROI: parseFloat((total / count).toFixed(1)),
      }))
      .sort((a, b) => b.avgROI - a.avgROI);
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

      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold">Where Should Shopsy Promote?</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Subcategories ranked by competitive pressure, Gen Z demand, and promotional gap vs Meesho.
          Click any row to see why it ranked where it did.
        </p>
      </div>

      {/* ── Section 1 — Scenario Comparison ─────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Scenario Comparison
        </p>
        <Card className="border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Compare two budget levels</CardTitle>
            <p className="text-xs text-muted-foreground">
              Enter two monthly promotional budgets in Rs Crore to compare how many subcategories each covers and the
              average quality of spend. Cost per subcategory is estimated from order volume, average price, and recommended
              discount depth across 30% promotional reach. The optimizer fills from the highest-ROI subcategories down.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Scenario A — Budget (Rs Crore / month)</label>
                <Input
                  type="number"
                  value={budgetA}
                  onChange={(e) => setBudgetA(e.target.value)}
                  className="h-9 w-full"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Scenario B — Budget (Rs Crore / month)</label>
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
              <Button onClick={() => setScenarioRun(true)} className="h-9 px-6 font-semibold">
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

        {scenarioRun && scenA && scenB && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <KPICard
                title="Scenario A — Subcategories"
                value={String(scenA.subcatCount)}
                subtitle="covered by budget"
                color="green"
                tooltip="Subcategories selected under Scenario A, filled in ROI priority order."
              />
              <KPICard
                title="Scenario A — Avg ROI Score"
                value={fmt1(scenA.avgROI)}
                subtitle="avg across selected"
                color="green"
                tooltip="Average ROI score across the subcategories selected. Higher means each spend decision has a stronger competitive justification."
              />
              <KPICard
                title="Scenario B — Subcategories"
                value={String(scenB.subcatCount)}
                subtitle="covered by budget"
                color="amber"
                tooltip="Subcategories selected under Scenario B, filled in ROI priority order."
              />
              <KPICard
                title="Scenario B — Avg ROI Score"
                value={fmt1(scenB.avgROI)}
                subtitle="avg across selected"
                color="amber"
                tooltip="Average ROI score across the subcategories selected under Scenario B."
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <Card className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Scenario A — Rs {budgetA}Cr · {scenA.subcatCount} subcategories · Avg ROI {fmt1(scenA.avgROI)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <AllocTable rows={scenA.rows} label={`A (Rs${budgetA}Cr)`} />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Scenario B — Rs {budgetB}Cr · {scenB.subcatCount} subcategories · Avg ROI {fmt1(scenB.avgROI)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <AllocTable rows={scenB.rows} label={`B (Rs${budgetB}Cr)`} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>

      {/* ── Section 2 — Full Priority Queue ──────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Subcategory Priority Queue
        </p>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Subcategories — Ranked by Promotion Opportunity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ranked by how strongly we recommend promoting now — based on Shopsy's price gap vs
              Meesho, Meesho's promotional intensity, Gen Z demand strength, and Shopsy's in-stock
              position. Click any row for the plain-English reasoning behind its score.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-2 overflow-x-auto">
            <PriorityQueueTable rows={allROI} />
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

      {/* ── Section 4 — Category Opportunity + Promo Mix ─────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Promo Opportunity by Category</CardTitle>
            <p className="text-xs text-muted-foreground">
              Average ROI score across subcategories per category. Higher = more subcategories
              with a strong competitive case to promote now.
            </p>
          </CardHeader>
          <CardContent>
            {categoryROIData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, categoryROIData.length * 34)}>
                <BarChart
                  data={categoryROIData}
                  layout="vertical"
                  margin={{ left: 160, right: 60, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}`} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={150}
                    fontSize={11}
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <RechartsTooltip
                    {...chartTooltipProps}
                    formatter={(v: number) => [v.toFixed(1), "Avg ROI Score"]}
                  />
                  <Bar dataKey="avgROI" radius={[0, 4, 4, 0]}>
                    {categoryROIData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="avgROI"
                      position="right"
                      fontSize={10}
                      formatter={(v: number) => v.toFixed(1)}
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
              Distribution of recommended promo types across all ranked subcategories
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
