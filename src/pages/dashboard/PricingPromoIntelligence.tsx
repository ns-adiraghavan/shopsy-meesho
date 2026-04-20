/**
 * PricingPromoIntelligence.tsx — v2.0 Category-First
 *
 * Layout:
 *   Section 1 — 4 KPI cards (live from category_pricing + category_summary)
 *   Section 2 — Two-panel main view
 *     Left  — Subcategory price gap table with promo intensity inline
 *              Each row has a "Flag for Budget" action (UI state only)
 *     Right — Time-series chart for whichever row is selected
 *   Section 3 — Unanswered Promotions: subcategories where Meesho is promoting, Shopsy is not
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Flag, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { chartTooltipProps } from "@/lib/chartStyles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  getSubcategoryPriceIndex,
  getPricingTrend,
  getUnansweredPromos,
  getLatestDate,
  datasets,
  GenZSignalLevel,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt1 = (n: number) => n.toFixed(1);
const fmtPct = (n: number, forceSign = false) =>
  `${forceSign && n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const GENZ_LABELS: Record<GenZSignalLevel, string> = {
  very_high: "Very High",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

const GENZ_PILL: Record<GenZSignalLevel, string> = {
  very_high: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  high: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  moderate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  low: "bg-muted text-muted-foreground",
};

function priceGapBg(gap: number) {
  if (gap > 15) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold";
  if (gap > 8) return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400";
  if (gap > 3) return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  if (gap >= -2) return "bg-muted text-muted-foreground";
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
}

function promoGapBg(gap: number) {
  if (gap > 12) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold";
  if (gap > 6) return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  if (gap > 2) return "bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD (simple)
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
// TIME-SERIES PANEL
// Shows Shopsy price gap trend for selected category × subcategory
// ─────────────────────────────────────────────────────────────────────────────

interface TrendSelection {
  category: string;
  subcategory: string;
}

function TrendPanel({ selection }: { selection: TrendSelection | null }) {
  const trendData = useMemo(() => {
    if (!selection) return [];
    const shopsy = getPricingTrend(selection.category, selection.subcategory, "Shopsy");
    const meesho = getPricingTrend(selection.category, selection.subcategory, "Meesho");
    const meeshoByDate: Record<string, number> = {};
    meesho.forEach((r) => { meeshoByDate[r.date] = r.avg_sale_price; });

    return shopsy.map((r) => ({
      date: r.date.slice(5),       // "MM-DD"
      priceGap: +r.price_gap_pct.toFixed(1),
      shopsyPrice: +r.avg_sale_price.toFixed(0),
      meeshoPrice: meeshoByDate[r.date] ? +meeshoByDate[r.date].toFixed(0) : null,
      shopsyPromo: r.promotion_flag === 1,
      meeshoPromo: datasets.categoryPricing.find(
        (p) => p.date === r.date && p.category === selection.category &&
               p.subcategory === selection.subcategory && p.platform === "Meesho"
      )?.promotion_flag === 1,
    }));
  }, [selection]);

  if (!selection) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-6">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Select a subcategory row to view its price gap trend</p>
        <p className="text-xs text-muted-foreground/60 mt-1">14-day price gap and promo activity</p>
      </div>
    );
  }

  const firstGap = trendData[0]?.priceGap ?? 0;
  const lastGap  = trendData[trendData.length - 1]?.priceGap ?? 0;
  const gapDelta = lastGap - firstGap;
  const TrendIcon = gapDelta > 1 ? TrendingUp : gapDelta < -1 ? TrendingDown : Minus;
  const trendColor = gapDelta > 1 ? "text-red-500" : gapDelta < -1 ? "text-emerald-500" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-foreground">{selection.subcategory}</p>
        <p className="text-[10px] text-muted-foreground">{selection.category}</p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px]">Latest gap</p>
          <p className={cn("font-bold tabular-nums text-sm", lastGap > 5 ? "text-red-600" : lastGap < 0 ? "text-emerald-600" : "")}>
            {fmtPct(lastGap, true)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">14-day change</p>
          <div className={cn("flex items-center gap-0.5 font-semibold tabular-nums", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {fmtPct(Math.abs(gapDelta), false)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
          <RechartsTooltip
            {...chartTooltipProps}
            formatter={(val: number, name: string) => [
              name === "priceGap" ? `${val}%` : `₹${val}`,
              name === "priceGap" ? "Price Gap" : name,
            ]}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 2" />
          <Line
            type="monotone"
            dataKey="priceGap"
            stroke="hsl(0, 72%, 51%)"
            strokeWidth={2}
            dot={false}
            name="priceGap"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="border-t border-border/50 pt-3">
        <p className="text-[10px] text-muted-foreground mb-2">Avg Sale Price — 14 days</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v}`} />
            <RechartsTooltip {...chartTooltipProps} formatter={(val: number) => [`₹${val}`, ""]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="shopsyPrice" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Shopsy" />
            <Line type="monotone" dataKey="meeshoPrice" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} name="Meesho" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PricingPromoIntelligence() {
  const [selectedRow, setSelectedRow] = useState<TrendSelection | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const latestDate = getLatestDate();

  // Subcategory price index — core table data
  const priceIndex = useMemo(() => getSubcategoryPriceIndex(), [latestDate]);

  // Unanswered promos
  const unanswered = useMemo(() => getUnansweredPromos(), [latestDate]);

  // Category filter list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(priceIndex.map((r) => r.category))).sort()],
    [priceIndex]
  );

  const filteredRows = useMemo(() => {
    const rows = categoryFilter === "All"
      ? priceIndex
      : priceIndex.filter((r) => r.category === categoryFilter);
    return [...rows].sort((a, b) => b.shopsy_price_gap_pct - a.shopsy_price_gap_pct);
  }, [priceIndex, categoryFilter]);

  // KPIs
  const avgGap = useMemo(() => {
    if (!filteredRows.length) return 0;
    return filteredRows.reduce((s, r) => s + r.shopsy_price_gap_pct, 0) / filteredRows.length;
  }, [filteredRows]);

  const overpricedCount = useMemo(() =>
    filteredRows.filter((r) => r.shopsy_price_gap_pct > 5).length, [filteredRows]);

  const meeshoPromoRate = useMemo(() => {
    const all = datasets.categoryPricing.filter((r) => r.date === latestDate && r.platform === "Meesho");
    if (!all.length) return 0;
    return (all.reduce((s, r) => s + r.promotion_flag, 0) / all.length) * 100;
  }, [latestDate]);

  const shopsyPromoRate = useMemo(() => {
    const all = datasets.categoryPricing.filter((r) => r.date === latestDate && r.platform === "Shopsy");
    if (!all.length) return 0;
    return (all.reduce((s, r) => s + r.promotion_flag, 0) / all.length) * 100;
  }, [latestDate]);

  const promoGap = meeshoPromoRate - shopsyPromoRate;

  // Flag helpers
  const flagKey = (cat: string, sub: string) => `${cat}||${sub}`;

  const toggleFlag = (cat: string, sub: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      const k = flagKey(cat, sub);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">Pricing &amp; Promotions Intelligence</h1>
        {flagged.size > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary">
            <Flag className="h-3.5 w-3.5" />
            {flagged.size} subcategor{flagged.size === 1 ? "y" : "ies"} flagged for Budget
          </div>
        )}
      </div>

      {/* ── Section 1 — KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Subcategories Overpriced vs Meesho"
          value={String(overpricedCount)}
          subtitle={`of ${filteredRows.length} subcategories >+5%`}
          color="red"
          tooltip="Subcategories where Shopsy's average sale price exceeds Meesho's by more than 5%."
        />
        <KPICard
          title="Avg Price Gap (Shopsy vs Meesho)"
          value={fmtPct(avgGap, true)}
          color={avgGap > 5 ? "red" : avgGap < -2 ? "green" : "amber"}
          tooltip="Average % difference between Shopsy and Meesho avg sale prices across all subcategories. Positive = Shopsy more expensive."
        />
        <KPICard
          title="Promo Intensity Gap"
          value={`+${fmt1(promoGap)}pp`}
          subtitle="Meesho promoting more"
          color="amber"
          tooltip="Meesho's active promo rate minus Shopsy's. Positive = Meesho is out-promoting Shopsy."
        />
        <KPICard
          title="Unanswered Promos"
          value={String(unanswered.length)}
          subtitle="Meesho active, Shopsy silent"
          color={unanswered.length > 5 ? "red" : "amber"}
          tooltip="Subcategories where Meesho has an active promotion today but Shopsy does not."
        />
      </div>

      {/* ── Section 2 — Two-panel: table + trend ────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Subcategory Price &amp; Promotion Analysis
        </p>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full h-7 text-xs px-3",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">

          {/* LEFT — Subcategory table */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Subcategory Price Index</CardTitle>
              <p className="text-xs text-muted-foreground">
                Shopsy vs Meesho — sorted by price gap descending.
                Click a row to view its trend. <Flag className="inline h-3 w-3 mb-0.5" /> to flag for Budget.
              </p>
            </CardHeader>
            <CardContent className="p-0 pb-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground w-[160px]">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px] w-[130px]">Category</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Price Gap <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Shopsy avg sale price vs Meesho. Positive = Shopsy more expensive.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            Promo Gap <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Meesho promo rate minus Shopsy promo rate. Positive = Meesho promoting more.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Meesho Campaign</th>
                    <th className="text-right py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No data loaded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const key = flagKey(row.category, row.subcategory);
                      const isFlagged = flagged.has(key);
                      const isSelected =
                        selectedRow?.category === row.category &&
                        selectedRow?.subcategory === row.subcategory;

                      return (
                        <tr
                          key={key}
                          className={cn(
                            "border-b border-border/40 last:border-0 cursor-pointer transition-colors",
                            isSelected
                              ? "bg-primary/8 border-l-2 border-l-primary"
                              : "hover:bg-muted/20"
                          )}
                          onClick={() =>
                            setSelectedRow(
                              isSelected ? null : { category: row.category, subcategory: row.subcategory }
                            )
                          }
                        >
                          <td className="py-2.5 pl-4 pr-2 font-medium">{row.subcategory}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{row.category}</td>

                          {/* Price Gap */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={cn("inline-block rounded px-2 py-0.5 text-xs tabular-nums", priceGapBg(row.shopsy_price_gap_pct))}>
                              {fmtPct(row.shopsy_price_gap_pct, true)}
                            </span>
                          </td>

                          {/* Promo Gap */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={cn("inline-block rounded px-2 py-0.5 text-xs tabular-nums", promoGapBg(row.promo_intensity_gap))}>
                              {row.promo_intensity_gap > 0 ? "+" : ""}{fmt1(row.promo_intensity_gap)}pp
                            </span>
                          </td>

                          {/* Gen Z Signal */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal])}>
                              {GENZ_LABELS[row.genz_signal]}
                            </span>
                          </td>

                          {/* Meesho Campaign Active */}
                          <td className="py-2.5 px-2 text-center">
                            {row.campaign_active_meesho ? (
                              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">
                                Active
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Flag for Budget */}
                          <td className="py-2.5 pl-2 pr-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFlag(row.category, row.subcategory); }}
                              className={cn(
                                "rounded p-1 transition-colors",
                                isFlagged
                                  ? "text-primary bg-primary/10"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                              )}
                              title={isFlagged ? "Unflag" : "Flag for Budget"}
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* RIGHT — Trend panel */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">14-Day Price Trend</CardTitle>
              <p className="text-xs text-muted-foreground">
                Price gap and avg sale price over the data window
              </p>
            </CardHeader>
            <CardContent>
              <TrendPanel selection={selectedRow} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 3 — Unanswered Promotions ───────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Unanswered Promotions
        </p>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Meesho is promoting — Shopsy is silent
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Subcategories where Meesho has an active promotion today and Shopsy does not.
              These are the highest-priority budget response opportunities.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {unanswered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No unanswered promotions detected today.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 pl-4 pr-3 font-medium text-muted-foreground">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Gen Z Signal</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Meesho Discount Depth</th>
                    <th className="text-right py-2.5 pl-3 pr-4 font-medium text-muted-foreground">Flag for Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {unanswered.map((row, i) => {
                    const key = flagKey(row.category, row.subcategory);
                    const isFlagged = flagged.has(key);
                    return (
                      <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                        <td className="py-2.5 pl-4 pr-3 font-medium">{row.subcategory}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{row.category}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal])}>
                            {GENZ_LABELS[row.genz_signal]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {fmt1(row.meesho_discount_depth)}%
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right">
                          <button
                            onClick={() => toggleFlag(row.category, row.subcategory)}
                            className={cn(
                              "rounded p-1 transition-colors",
                              isFlagged
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                            )}
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
