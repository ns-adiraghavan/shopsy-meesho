import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertTriangle, AlertCircle, Info, TrendingUp, Zap, Tag, Package, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPlatformSummaryFor,
  getCategoryPressureMatrix,
  getPromotionROI,
  getEvents,
  CategorySummary,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt1 = (n: number) => n.toFixed(1);
const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

function formatPrice(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DUAL KPI CARD — unchanged, used for the 4 remaining standard cards
// ─────────────────────────────────────────────────────────────────────────────

type Highlight = "green" | "red" | "amber" | "none";

interface DualKPIProps {
  title: string;
  shopsyValue: string;
  meeshoValue: string;
  shopsyHighlight?: Highlight;
  meeshoHighlight?: Highlight;
  tooltip?: string;
  subtitle?: string;
}

const highlightColor = (h?: Highlight) => {
  switch (h) {
    case "green": return "text-emerald-600 dark:text-emerald-400";
    case "red":   return "text-red-600 dark:text-red-400";
    case "amber": return "text-amber-600 dark:text-amber-400";
    default:      return "";
  }
};

function DualKPICard({
  title, shopsyValue, meeshoValue,
  shopsyHighlight = "none", meeshoHighlight = "none",
  tooltip, subtitle,
}: DualKPIProps) {
  return (
    <TooltipProvider>
      <Card className="bg-gradient-card p-0">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            {title}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </CardTitle>
          {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Shopsy</p>
              <p className={cn("text-xl font-bold tabular-nums", highlightColor(shopsyHighlight))}>
                {shopsyValue}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Meesho</p>
              <p className={cn("text-xl font-bold tabular-nums", highlightColor(meeshoHighlight))}>
                {meeshoValue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CARD A — UNANSWERED MEESHO PROMOTIONS
// Replaces: "Competitiveness Score"
//
// Shows the count of calendar days within the data window where Meesho ran
// an active campaign in a subcategory and Shopsy ran no counter-promotion.
// Source: category_summary.unanswered_campaign_days (pre-computed in generator).
// ─────────────────────────────────────────────────────────────────────────────

// CategorySummary now includes unanswered_campaign_days from dataLoader.ts

function UnansweredPromosKPI() {
  const data = useMemo(() => {
    const rows = getCategoryPressureMatrix();

    const totalUnanswered = rows.reduce(
      (sum, r) => sum + (r.unanswered_campaign_days ?? 0),
      0
    );

    const affectedCategories = rows.filter(
      (r) => (r.unanswered_campaign_days ?? 0) > 0
    ).length;

    const worst = rows.reduce<CategorySummary | null>((prev, cur) => {
      if (!prev) return cur;
      return (cur.unanswered_campaign_days ?? 0) > (prev.unanswered_campaign_days ?? 0)
        ? cur : prev;
    }, null);

    const severity: "critical" | "high" | "moderate" =
      totalUnanswered >= 10 ? "critical"
      : totalUnanswered >= 5  ? "high"
      : "moderate";

    return { totalUnanswered, affectedCategories, worst, severity, total: rows.length };
  }, []);

  const severityMeta = {
    critical: { label: "Critical Exposure", numClass: "text-red-600 dark:text-red-400",   badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
    high:     { label: "High Exposure",     numClass: "text-amber-600 dark:text-amber-400", badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    moderate: { label: "Moderate",          numClass: "text-yellow-600 dark:text-yellow-400", badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  }[data.severity];

  return (
    <TooltipProvider>
      <Card className="bg-gradient-card p-0">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            Unanswered Promotions
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Days in the 14-day window where Meesho ran an active promotional
                  campaign in a subcategory while Shopsy had no counter-promotion.
                  High counts = Meesho captured unchallenged promotional share.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-[10px] text-muted-foreground/70">14-day window · all subcategories</p>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="flex items-end gap-2 mb-2">
            <p className={`text-3xl font-bold tabular-nums leading-none ${severityMeta.numClass}`}>
              {data.totalUnanswered}
            </p>
            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">
              campaign-days<br />left uncontested
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 mb-2 ${severityMeta.badgeClass}`}
          >
            {severityMeta.label}
          </Badge>
          <div className="space-y-0.5 mt-1">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{data.affectedCategories}</span>
              {" "}of {data.total} categories exposed
            </p>
            {data.worst && (data.worst.unanswered_campaign_days ?? 0) > 0 && (
              <p className="text-[11px] text-muted-foreground truncate">
                Worst:{" "}
                <span className="font-semibold text-foreground">{data.worst.category}</span>
                {" "}({data.worst.unanswered_campaign_days}d)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CARD C — TOP 3 PROMO ROI SUBCATEGORIES
// Replaces: "Avg Discount Depth"
//
// Shows the top 3 subcategories by promotion_roi_score with:
//   • Recommended promo type + discount depth
//   • Shopsy price premium vs Meesho
//   • Orders/month at risk (derived from Meesho 1.83B annual orders × GMV weights
//     × price elasticity -1.2/pp, capped 35% — Meesho RHP + Redseer FY25)
//   • Gen Z signal label
// ─────────────────────────────────────────────────────────────────────────────

// Extend PromotionROI with v3 fields — remove cast once dataLoader.ts is updated
interface PromotionROIV3 {
  category: string;
  subcategory: string;
  genz_signal: string;
  avg_price_gap_pct: number;
  avg_subcategory_price_inr?: number;
  promotion_roi_score: number;
  recommended_promo_type: string;
  recommended_discount: number;
  orders_at_risk?: number;
  orders_at_risk_label?: string;
  budget_priority: string;
}

const PROMO_ICON: Record<string, JSX.Element> = {
  "Flash Sale":    <Zap     className="h-3 w-3" />,
  "Coupon":        <Tag     className="h-3 w-3" />,
  "Flat Discount": <Percent className="h-3 w-3" />,
  "Bundle":        <Package className="h-3 w-3" />,
};

const PROMO_COLOUR: Record<string, string> = {
  "Flash Sale":    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  "Coupon":        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  "Flat Discount": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "Bundle":        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const GENZ_COLOUR: Record<string, string> = {
  very_high: "text-purple-600 dark:text-purple-400",
  high:      "text-indigo-600 dark:text-indigo-400",
  moderate:  "text-slate-500 dark:text-slate-400",
  low:       "text-slate-400 dark:text-slate-500",
};

const GENZ_LABEL: Record<string, string> = {
  very_high: "Trending",
  high:      "Rising",
  moderate:  "Emerging",
  low:       "Watching",
};

function TopROISubcategoriesKPI() {
  const top3 = useMemo(() => {
    // getPromotionROI() already returns sorted by promotion_roi_score desc
    return (getPromotionROI() as unknown as PromotionROIV3[]).slice(0, 3);
  }, []);

  return (
    <TooltipProvider>
      <Card className="bg-gradient-card p-0">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
            Top Promo Opportunities
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="text-xs">
                  Ranked by ROI score: price premium vs Meesho (30%), Meesho promo
                  intensity (25%), Gen Z signal (25%), Shopsy availability (20%).
                  Orders at risk = Meesho monthly orders in subcategory (Meesho RHP
                  1.83B annual ÷ Redseer category weights) × price suppression at
                  −1.2 per % gap, capped 35%.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-[10px] text-muted-foreground/70">Ranked by ROI score · Shopsy vs Meesho</p>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1 space-y-2">
          {top3.map((row, idx) => {
            const promoColour = PROMO_COLOUR[row.recommended_promo_type] ?? PROMO_COLOUR["Bundle"];
            const promoIcon   = PROMO_ICON[row.recommended_promo_type]   ?? <Tag className="h-3 w-3" />;
            const genzColour  = GENZ_COLOUR[row.genz_signal] ?? GENZ_COLOUR["moderate"];
            const genzLabel   = GENZ_LABEL[row.genz_signal]  ?? "Watching";
            const hasGap      = row.avg_price_gap_pct > 0;
            const hasRisk     = (row.orders_at_risk ?? 0) > 0;

            return (
              <div
                key={`${row.category}-${row.subcategory}`}
                className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5 space-y-1"
              >
                {/* Name row */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-tight truncate">
                        {row.subcategory}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{row.category}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${genzColour}`}>
                    {genzLabel}
                  </span>
                </div>

                {/* Promo badge + price gap */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${promoColour}`}
                  >
                    {promoIcon}
                    {row.recommended_promo_type} −{row.recommended_discount.toFixed(0)}%
                  </Badge>
                  {hasGap && (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                      +{row.avg_price_gap_pct.toFixed(1)}% vs Meesho
                    </span>
                  )}
                </div>

                {/* Orders at risk */}
                {hasRisk && (
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {row.orders_at_risk_label}
                    </span>
                    {row.avg_subcategory_price_inr && (
                      <span className="ml-1 text-muted-foreground/60">
                        · avg {formatPrice(row.avg_subcategory_price_inr)} item
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY PRESSURE MATRIX — unchanged
// ─────────────────────────────────────────────────────────────────────────────

type CellColor = "red" | "amber" | "green";

function priceGapColor(gap: number): CellColor {
  if (gap > 10) return "red";
  if (gap > 3)  return "amber";
  return "green";
}

function promoGapColor(gap: number): CellColor {
  if (gap > 8)  return "red";
  if (gap > 3)  return "amber";
  return "green";
}

function assortmentColor(shopsy: number, meesho: number): CellColor {
  const ratio = meesho > 0 ? shopsy / meesho : 1;
  if (ratio < 0.70) return "red";
  if (ratio < 0.88) return "amber";
  return "green";
}

function genzColor(score: number): CellColor {
  if (score >= 72) return "green";
  if (score >= 55) return "amber";
  return "red";
}

function pressureBadgeColor(pressure: string): string {
  switch (pressure) {
    case "Critical": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "High":     return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Medium":   return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    default:         return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
}

const cellBg = (color: CellColor) => {
  switch (color) {
    case "red":   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "amber": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "green": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
};

function PressureMatrix({ rows }: { rows: CategorySummary[] }) {
  const PRESSURE_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, "N/A": 4 };
  const sorted = [...rows].sort(
    (a, b) => (PRESSURE_ORDER[a.competitive_pressure] ?? 9) - (PRESSURE_ORDER[b.competitive_pressure] ?? 9)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Category Pressure Matrix</CardTitle>
        <p className="text-xs text-muted-foreground">
          All values from Shopsy's perspective — Red = Shopsy disadvantaged · Green = Shopsy leading · Amber = neutral
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2.5 pl-4 pr-3 text-xs font-medium text-muted-foreground w-[200px]">
                Category
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 mx-auto">
                      Price Gap
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Shopsy avg price vs Meesho in same subcategories. Positive = Shopsy more expensive.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 mx-auto">
                      Promo Gap
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Meesho promo rate minus Shopsy promo rate. Positive = Meesho promoting more.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 mx-auto">
                      Assortment
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Shopsy listing depth vs Meesho. Below 0.70 = Shopsy materially under-assorted.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                Gen Z Score
              </th>
              <th className="text-center py-2.5 pl-3 pr-4 text-xs font-medium text-muted-foreground">
                Pressure
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const depthRatio = row.meesho_depth_score > 0 ? row.shopsy_depth_score / row.meesho_depth_score : 1;
              return (
                <tr
                  key={row.category}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-2.5 pl-4 pr-3 font-medium text-xs">{row.category}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums", cellBg(priceGapColor(row.avg_price_gap_pct)))}>
                      {fmtPct(row.avg_price_gap_pct)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums", cellBg(promoGapColor(row.promo_intensity_gap)))}>
                      {row.promo_intensity_gap > 0 ? "+" : ""}{fmt1(row.promo_intensity_gap)}pp
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums", cellBg(assortmentColor(row.shopsy_depth_score, row.meesho_depth_score)))}>
                      {depthRatio.toFixed(2)}×
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums", cellBg(genzColor(row.avg_genz_score)))}>
                      {fmt1(row.avg_genz_score)}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 pr-4 text-center">
                    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold", pressureBadgeColor(row.competitive_pressure))}>
                      {row.competitive_pressure}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT FEED — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { High: 0, Medium: 1, Info: 2 };

const severityIcon = (severity: string) => {
  switch (severity) {
    case "High":   return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case "Medium": return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
    default:       return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
};

const severityBadge = (severity: string) => {
  switch (severity) {
    case "High":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{severity}</Badge>;
    case "Medium":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">{severity}</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{severity}</Badge>;
  }
};

const eventTypePill = (type: string) => {
  const colors: Record<string, string> = {
    "Price Gap Alert":      "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    "Promo Surge":          "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    "Assortment Gap":       "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    "Availability Risk":    "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    "Competitive Strength": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  };
  return (
    <span className={cn("inline-block rounded px-1.5 py-0 text-[10px] font-medium", colors[type] ?? "bg-muted text-muted-foreground")}>
      {type}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CompetitiveOverview() {
  const shopsy = getPlatformSummaryFor("Shopsy");
  const meesho = getPlatformSummaryFor("Meesho");
  const pressureRows = getCategoryPressureMatrix();

  const events = useMemo(() => {
    return getEvents().sort((a, b) => {
      const s = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
      return s !== 0 ? s : b.date.localeCompare(a.date);
    });
  }, []);

  const s = shopsy;
  const m = meesho;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Section 1 — KPI Bar ─────────────────────────────────────────── */}
      <section>
        <h1 className="text-lg font-semibold mb-3">Competitive Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">

          {/* CARD A — replaces Competitiveness Score */}
          <UnansweredPromosKPI />

          <DualKPICard
            title="Avg Price Gap"
            shopsyValue={s ? fmtPct(s.avg_price_gap_pct) : "—"}
            meeshoValue={m ? fmtPct(m.avg_price_gap_pct) : "—"}
            shopsyHighlight={s ? (s.avg_price_gap_pct > 5 ? "red" : s.avg_price_gap_pct < 0 ? "green" : "amber") : "none"}
            meeshoHighlight={m ? (m.avg_price_gap_pct < 0 ? "green" : "none") : "none"}
            tooltip="Positive = this platform is more expensive vs competitor in the same subcategory."
          />

          <DualKPICard
            title="Active Promo Rate"
            shopsyValue={s ? `${fmt1(s.active_promo_rate)}%` : "—"}
            meeshoValue={m ? `${fmt1(m.active_promo_rate)}%` : "—"}
            meeshoHighlight="amber"
            tooltip="% of subcategory × date observations with an active promotion running."
          />

          {/* CARD C — replaces Avg Discount Depth */}
          <TopROISubcategoriesKPI />

          <DualKPICard
            title="Gen Z Traction"
            shopsyValue={s ? fmt1(s.avg_genz_traction) : "—"}
            meeshoValue={m ? fmt1(m.avg_genz_traction) : "—"}
            shopsyHighlight={s && m ? (s.avg_genz_traction >= m.avg_genz_traction ? "green" : "amber") : "none"}
            subtitle="Avg score 0–100"
            tooltip="Average Gen Z traction score across all subcategories. Higher = stronger Gen Z engagement on that platform."
          />

          <DualKPICard
            title="Availability Rate"
            shopsyValue={s ? `${fmt1(s.availability_rate)}%` : "—"}
            meeshoValue={m ? `${fmt1(m.availability_rate)}%` : "—"}
            shopsyHighlight={s && m ? (s.availability_rate >= m.availability_rate ? "green" : "amber") : "none"}
            tooltip="Average in-stock rate across all monitored subcategories."
          />

        </div>
      </section>

      {/* ── Section 2 — Real-World Anchors ──────────────────────────────── */}
      {(s || m) && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "Meesho Annual Orders",
              value: m?.ref_annual_orders_bn ? `${m.ref_annual_orders_bn}B` : "—",
              note: "FY25 placed orders",
              icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Meesho Avg Order Value",
              value: m?.ref_avg_order_value_inr ? `₹${m.ref_avg_order_value_inr}` : "—",
              note: "FY25 (Meesho RHP)",
              icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Meesho Total Users",
              value: m?.ref_total_users_mn ? `${m.ref_total_users_mn}M` : "—",
              note: "Annual transacting users",
              icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Shopsy Total Users",
              value: s?.ref_total_users_mn ? `${s.ref_total_users_mn}M+` : "—",
              note: `${s?.ref_tier2_order_share_pct ?? "—"}% from Tier 2/3+`,
              icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            },
          ].map((item) => (
            <Card key={item.label} className="px-4 py-3 flex items-start gap-3">
              {item.icon}
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold tabular-nums">{item.value}</p>
                <p className="text-[10px] text-muted-foreground/70">{item.note}</p>
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* ── Section 3 — Category Pressure Matrix ────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Category Intelligence
        </p>
        {pressureRows.length > 0 ? (
          <PressureMatrix rows={pressureRows} />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Category summary data not yet loaded.
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Section 4 — Competitor Event Feed ───────────────────────────── */}
      <section>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Competitor Event Feed</CardTitle>
            <p className="text-xs text-muted-foreground">
              Recent competitive signals sorted by severity — Price gaps, promo surges, assortment gaps, stockout risks
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No events loaded yet.
                </p>
              ) : (
                events.map((evt, i) => (
                  <div
                    key={`${evt.date}-${evt.category}-${evt.subcategory}-${i}`}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    {severityIcon(evt.severity)}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {severityBadge(evt.severity)}
                        {eventTypePill(evt.event_type)}
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{evt.category}</span>
                        {evt.subcategory && (
                          <>
                            <span className="text-[10px] text-muted-foreground">›</span>
                            <span className="text-xs font-medium text-foreground/80">{evt.subcategory}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{evt.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                      {new Date(evt.date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
