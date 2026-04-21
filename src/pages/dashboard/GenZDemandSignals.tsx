/**
 * GenZDemandSignals.tsx — v2.0 Category-First
 *
 * Layout:
 *   Section 1 — 4 KPI cards
 *   Section 2 — Subcategory Gen Z leaderboard with platform split
 *                (which platform owns the Gen Z signal per subcategory)
 *   Section 3 — Category-level Gen Z score bar chart (Shopsy vs Meesho)
 *   Section 4 — Gen Z signal by search visibility (category_search data)
 *   Section 5 — Strategic response panel: high Gen Z subcategories where
 *                Shopsy trails Meesho on score AND has a price premium
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Flame, TrendingUp } from "lucide-react";
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
  LabelList,
  Cell,
} from "recharts";
import {
  getGenZLeaderboard,
  getGenZPlatformSplit,
  getLatestDate,
  getSearchLatest,
  getSubcategoryPriceIndex,
  datasets,
  GenZSignalLevel,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const GENZ_PILL: Record<GenZSignalLevel, string> = {
  very_high: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  high:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  moderate:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  low:       "bg-muted text-muted-foreground",
};

const GENZ_LABEL: Record<GenZSignalLevel, string> = {
  very_high: "Very High",
  high:      "High",
  moderate:  "Moderate",
  low:       "Low",
};

const SIGNAL_ORDER: Record<GenZSignalLevel, number> = {
  very_high: 0, high: 1, moderate: 2, low: 3,
};

// Category-level search keywords (from gen script CATEGORY_KEYWORDS)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Women's Ethnic Wear":       ["saree online","cotton kurti","kurta set women","lehenga choli","anarkali suit","ethnic set","palazzo kurta","sharara set","indian dress women","kurti festive"],
  "Women's Western Wear":      ["coord set women","oversized tshirt","bodycon dress","crop top","midi dress","baggy jeans women","co-ord set trendy","western dress","jumpsuit women","tops tunics"],
  "Men's Fashion":             ["oversized tshirt men","casual shirt men","slim fit jeans","cargo pants","polo tshirt","men ethnic kurta","graphic tee","hoodie men","men formal shirt","chino trousers"],
  "Home & Kitchen":            ["kitchen organiser","chopper vegetable","storage containers","bedsheet set","wall stickers aesthetic","cookware set","pressure cooker","kitchen gadgets","curtains home","home decor"],
  "Beauty & Personal Care":    ["face serum","vitamin c serum","sunscreen spf50","kajal eyeliner","lipstick combo","hair oil","mamaearth serum","korean skincare","hair serum","makeup kit"],
  "Jewellery & Accessories":   ["oxidised earrings","jhumka earrings","artificial jewellery set","handbag women","sling bag","smartwatch","sunglasses women","bangles set","necklace set","hair accessories"],
  "Electronics & Accessories": ["wireless earbuds","bluetooth speaker","mobile cover","gaming headset","mechanical keyboard","power bank","tempered glass","laptop bag","earphones","smartwatch fitness"],
  "Footwear":                  ["sneakers men","sports shoes","heels women","juttis ethnic","sandals women","campus shoes","formal shoes men","slippers men","running shoes","ethnic footwear"],
  "Kids & Baby":               ["baby romper","kids frock","boys tshirt","girls ethnic dress","baby care kit","kids kurta","soft toy","school bag","baby blanket","toddler dress"],
  "Innerwear & Nightwear":     ["bra padded","women brief","night suit","ladies innerwear set","lounge pants","bralette","men vest","boxer shorts","pyjama set","sleep wear"],
};

const LEADERBOARD_PREVIEW  = 10;
const RESPONSE_GAP_PREVIEW = 8;

function trendBadge(label: string) {
  switch (label) {
    case "Trending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0 font-medium">
          <Flame className="h-2.5 w-2.5" /> Trending
        </span>
      );
    case "Rising":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0 font-medium">
          <TrendingUp className="h-2.5 w-2.5" /> Rising
        </span>
      );
    case "Emerging":
      return (
        <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-[10px] px-1.5 py-0 font-medium">
          Emerging
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border text-[10px] px-1.5 py-0 font-medium">
          Watching
        </span>
      );
  }
}

function scoreBar(score: number) {
  const color =
    score >= 80 ? "bg-red-500" :
    score >= 65 ? "bg-amber-500" :
    score >= 50 ? "bg-violet-400" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums text-xs font-semibold">{score.toFixed(0)}</span>
    </div>
  );
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

export default function GenZDemandSignals() {
  const [catFilter, setCatFilter]             = useState("All");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const [showAllResponse, setShowAllResponse]       = useState(false);

  const latestDate = getLatestDate();

  // Section 2 — Platform split leaderboard
  const platformSplit = useMemo(() => getGenZPlatformSplit(), [latestDate]);

  // Section 2 — raw leaderboard (for KPI counts)
  const leaderboard = useMemo(() => getGenZLeaderboard(), [latestDate]);

  // Category filter list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(platformSplit.map((r) => r.category))).sort()],
    [platformSplit]
  );

  const filteredSplit = useMemo(() => {
    const rows = catFilter === "All"
      ? platformSplit
      : platformSplit.filter((r) => r.category === catFilter);
    return [...rows].sort(
      (a, b) => SIGNAL_ORDER[a.genz_signal_level] - SIGNAL_ORDER[b.genz_signal_level]
        || Math.max(b.shopsy_score, b.meesho_score) - Math.max(a.shopsy_score, a.meesho_score)
    );
  }, [platformSplit, catFilter]);

  // KPIs
  const trendingCount = useMemo(
    () => leaderboard.filter((r) => r.genz_traction_score >= 80).length,
    [leaderboard]
  );
  const veryHighCount = useMemo(
    () => platformSplit.filter((r) => r.genz_signal_level === "very_high").length,
    [platformSplit]
  );
  const shopsyLeadsCount = useMemo(
    () => platformSplit.filter((r) => r.leading_platform === "Shopsy").length,
    [platformSplit]
  );
  const meeshoLeadsCount = useMemo(
    () => platformSplit.filter((r) => r.leading_platform === "Meesho").length,
    [platformSplit]
  );

  // Section 3 — Category avg scores for Shopsy and Meesho
  const categoryChartData = useMemo(() => {
    const catMap: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    const all = datasets.genzSignals.filter((r) => r.date === latestDate);
    all.forEach((r) => {
      const entry = (catMap[r.category] ??= { shopsy: [], meesho: [] });
      if (r.platform === "Shopsy") entry.shopsy.push(r.genz_traction_score);
      else entry.meesho.push(r.genz_traction_score);
    });
    return Object.entries(catMap)
      .map(([category, v]) => ({
        category,
        Shopsy: v.shopsy.length ? +(v.shopsy.reduce((a, b) => a + b, 0) / v.shopsy.length).toFixed(1) : 0,
        Meesho: v.meesho.length ? +(v.meesho.reduce((a, b) => a + b, 0) / v.meesho.length).toFixed(1) : 0,
      }))
      .sort((a, b) => Math.max(b.Shopsy, b.Meesho) - Math.max(a.Shopsy, a.Meesho));
  }, [latestDate]);

  // Section 4 — Search visibility for high Gen Z subcategories
  const searchData = useMemo(() => {
    const search = getSearchLatest();
    const highGenZ = new Set(
      platformSplit
        .filter((r) => r.genz_signal_level === "very_high" || r.genz_signal_level === "high")
        .map((r) => r.subcategory)
    );
    const catMap: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    search
      .filter((r) => highGenZ.has(r.subcategory))
      .forEach((r) => {
        const entry = (catMap[r.subcategory] ??= { shopsy: [], meesho: [] });
        if (r.platform === "Shopsy") entry.shopsy.push(r.visibility_rate * 100);
        else entry.meesho.push(r.visibility_rate * 100);
      });
    return Object.entries(catMap)
      .map(([subcategory, v]) => ({
        subcategory: subcategory.length > 22 ? subcategory.slice(0, 20) + "…" : subcategory,
        Shopsy: v.shopsy.length ? +(v.shopsy.reduce((a, b) => a + b, 0) / v.shopsy.length).toFixed(1) : 0,
        Meesho: v.meesho.length ? +(v.meesho.reduce((a, b) => a + b, 0) / v.meesho.length).toFixed(1) : 0,
      }))
      .sort((a, b) => b.Meesho - a.Meesho)
      .slice(0, 12);
  }, [latestDate, platformSplit]);

  // Section 5 — Strategic response: high Gen Z + Shopsy trailing + price premium
  const priceIndex = useMemo(() => getSubcategoryPriceIndex(), [latestDate]);
  const responseGaps = useMemo(() => {
    return filteredSplit
      .filter(
        (r) =>
          (r.genz_signal_level === "very_high" || r.genz_signal_level === "high") &&
          r.leading_platform === "Meesho" &&
          r.score_gap > 3
      )
      .map((r) => {
        const pricing = priceIndex.find(
          (p) => p.category === r.category && p.subcategory === r.subcategory
        );
        return {
          ...r,
          shopsy_price_gap_pct: pricing?.shopsy_price_gap_pct ?? 0,
          meesho_campaign: pricing?.campaign_active_meesho ?? false,
        };
      })
      .sort((a, b) => b.meesho_score - a.meesho_score);
  }, [filteredSplit, priceIndex]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold">Gen Z Demand Signals</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Subcategory-level Gen Z traction — which platform owns the signal, where Shopsy must respond
        </p>
      </div>

      {/* ── Section 1 — KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Trending Subcategories (score ≥ 80)"
          value={String(trendingCount)}
          subtitle="across both platforms"
          color="red"
          tooltip="Subcategory × platform combinations with a Gen Z traction score of 80 or above on the latest date."
        />
        <KPICard
          title="Very High Gen Z Signal"
          value={String(veryHighCount)}
          subtitle="subcategories"
          color="amber"
          tooltip="Subcategories rated 'very_high' Gen Z signal in the taxonomy — Co-ord Sets, Oversized T-shirts, Serums, Audio, Gaming."
        />
        <KPICard
          title="Shopsy Leads Gen Z"
          value={String(shopsyLeadsCount)}
          subtitle={`Meesho leads ${meeshoLeadsCount}`}
          color="green"
          tooltip="Subcategories where Shopsy's Gen Z traction score exceeds Meesho's on the latest date."
        />
        <KPICard
          title="Response Gap"
          value={String(responseGaps.length)}
          subtitle="high Gen Z, Meesho leading"
          color={responseGaps.length > 6 ? "red" : "amber"}
          tooltip="High/Very High Gen Z subcategories where Meesho currently leads Shopsy by more than 3 points."
        />
      </div>

      {/* ── Section 2 — Platform Split Leaderboard ────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Subcategory Gen Z Platform Split
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gen Z Traction by Subcategory — Platform Owner</CardTitle>
            <p className="text-xs text-muted-foreground">
              Which platform owns the Gen Z signal per subcategory. Sorted by signal level then score.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-2 overflow-x-auto">
            <div>
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
                    <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground w-[170px]">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z Signal</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Shopsy Score</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Meesho Score</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Leader</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto cursor-default">
                            Gap <HelpCircle className="h-3 w-3 opacity-50" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px]">
                            <p className="text-xs">How far Shopsy's Gen Z traction trails or leads Meesho in this subcategory. Positive = Meesho leads.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Trending Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSplit.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No Gen Z signal data loaded yet.
                      </td>
                    </tr>
                  ) : (
                    (showAllLeaderboard ? filteredSplit : filteredSplit.slice(0, LEADERBOARD_PREVIEW)).map((row) => (
                      <tr
                        key={`${row.category}-${row.subcategory}`}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 font-medium">{row.subcategory}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{row.category}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal_level])}>
                            {GENZ_LABEL[row.genz_signal_level]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{scoreBar(row.shopsy_score)}</td>
                        <td className="py-2.5 px-3">{scoreBar(row.meesho_score)}</td>
                        <td className="py-2.5 px-2 text-center">
                          <Badge
                            variant={row.leading_platform === "Shopsy" ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {row.leading_platform}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums",
                            row.score_gap > 8
                              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              : row.score_gap > 3
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {row.score_gap.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(CATEGORY_KEYWORDS[row.category] ?? []).slice(0, 3).map((kw) => (
                              <span key={kw} className="inline-block rounded-full bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 whitespace-nowrap">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredSplit.length > LEADERBOARD_PREVIEW && (
              <div className="px-4 pt-3 pb-1">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAllLeaderboard(v => !v)}>
                  {showAllLeaderboard ? "Show fewer" : `Show all ${filteredSplit.length} subcategories`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 3 — Category Chart ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gen Z Traction Score by Category</CardTitle>
          <p className="text-xs text-muted-foreground">
            Average Gen Z traction score per category — Shopsy vs Meesho. Latest date.
          </p>
        </CardHeader>
        <CardContent>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, categoryChartData.length * 34)}>
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ left: 160, right: 50, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={150}
                  fontSize={11}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [v.toFixed(1), ""]} />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Shopsy" position="right" fontSize={10} />
                </Bar>
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Meesho" position="right" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4 — Search Visibility for High Gen Z Subcategories ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search Visibility — High Gen Z Subcategories</CardTitle>
          <p className="text-xs text-muted-foreground">
            Search slot share (%) for Very High and High Gen Z subcategories. Lower visibility in trending categories = missed demand.
          </p>
        </CardHeader>
        <CardContent>
          {searchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(260, searchData.length * 30)}>
              <BarChart
                data={searchData}
                layout="vertical"
                margin={{ left: 160, right: 50, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 60]} tickFormatter={(v: number) => `${v}%`} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="subcategory"
                  width={150}
                  fontSize={11}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <RechartsTooltip
                  {...chartTooltipProps}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, ""]}
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
            <p className="text-sm text-muted-foreground py-8 text-center">No search data available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5 — Strategic Response Panel ────────────────────── */}
      {responseGaps.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
            Strategic Response
          </p>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                Shopsy Response Gap — Meesho leads Gen Z here
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                High/Very High Gen Z subcategories where Meesho's traction score exceeds Shopsy's by more than 3 points.
                These are the highest-priority subcategories for promotional response or assortment investment.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground">Subcategory</th>
                    <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z Signal</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Meesho Score</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Shopsy Score</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Score Gap</th>
                    <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Price Premium</th>
                    <th className="text-center py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Meesho Campaign</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllResponse ? responseGaps : responseGaps.slice(0, RESPONSE_GAP_PREVIEW)).map((row) => (
                    <tr
                      key={`${row.category}-${row.subcategory}`}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-medium">{row.subcategory}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{row.category}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal_level])}>
                          {GENZ_LABEL[row.genz_signal_level]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {row.meesho_score.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold tabular-nums text-muted-foreground">
                        {row.shopsy_score.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          -{row.score_gap.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn(
                          "inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums",
                          row.shopsy_price_gap_pct > 10
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : row.shopsy_price_gap_pct > 3
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        )}>
                          {row.shopsy_price_gap_pct > 0 ? "+" : ""}{row.shopsy_price_gap_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-center">
                        {row.meesho_campaign ? (
                          <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">
                            Active
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {responseGaps.length > RESPONSE_GAP_PREVIEW && (
                <div className="pt-3 pb-1">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAllResponse(v => !v)}>
                    {showAllResponse ? "Show fewer" : `Show all ${responseGaps.length} subcategories`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
