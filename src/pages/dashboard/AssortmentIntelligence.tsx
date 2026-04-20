/**
 * AssortmentIntelligence.tsx — v2.0 Category-First
 *
 * Layout:
 *   Section 1 — 4 KPI cards
 *   Section 2 — Depth ratio chart: Shopsy vs Meesho listing depth per subcategory,
 *                sorted by Gen Z signal strength (primary viz per MD spec)
 *   Section 3 — Subcategory depth table: depth ratio, gap, priority, Gen Z signal
 *   Section 4 — Category depth comparison bar chart (Shopsy vs Meesho avg depth scores)
 *   Section 5 — Unique category gaps: subcategories present on one platform, absent on other
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertTriangle } from "lucide-react";
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
  ReferenceLine,
} from "recharts";
import {
  getAssortmentLatest,
  getLatestDate,
  datasets,
  GenZSignalLevel,
  AssortmentPriority,
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

function priorityBadge(priority: AssortmentPriority) {
  switch (priority) {
    case "High":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">High Priority</Badge>;
    case "Medium":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">Medium</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Low</Badge>;
  }
}

function depthRatioColor(ratio: number): string {
  // ratio = shopsy / meesho. <0.70 = red, <0.88 = amber, ≥0.88 = green
  if (ratio < 0.70) return "hsl(0, 72%, 51%)";
  if (ratio < 0.88) return "hsl(38, 92%, 50%)";
  return "hsl(142, 71%, 45%)";
}

function depthRatioBg(ratio: number): string {
  if (ratio < 0.70) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold";
  if (ratio < 0.88) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
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

export default function AssortmentIntelligence() {
  const [catFilter, setCatFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | AssortmentPriority>("All");
  const [showAllTable, setShowAllTable] = useState(false);
  const TABLE_PREVIEW = 10;

  const latestDate = getLatestDate();

  // Core assortment data — sorted by Gen Z signal then depth gap
  const assortment = useMemo(() => getAssortmentLatest(), [latestDate]);

  // Category filter list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(assortment.map((r) => r.category))).sort()],
    [assortment]
  );

  const filtered = useMemo(() => {
    let rows = catFilter === "All"
      ? assortment
      : assortment.filter((r) => r.category === catFilter);
    if (priorityFilter !== "All") {
      rows = rows.filter((r) => r.assortment_priority === priorityFilter);
    }
    return rows;
  }, [assortment, catFilter, priorityFilter]);

  // KPIs
  const criticalGapCount = useMemo(
    () => assortment.filter((r) => r.depth_ratio < 0.70).length,
    [assortment]
  );
  const highPriorityCount = useMemo(
    () => assortment.filter((r) => r.assortment_priority === "High").length,
    [assortment]
  );
  const avgDepthRatio = useMemo(() => {
    if (!assortment.length) return 0;
    return assortment.reduce((s, r) => s + r.depth_ratio, 0) / assortment.length;
  }, [assortment]);
  const shopsyLeadsCount = useMemo(
    () => assortment.filter((r) => r.shopsy_depth_score >= r.meesho_depth_score).length,
    [assortment]
  );

  // Section 2 — Depth ratio bar chart (primary viz, sorted by Gen Z signal)
  const depthRatioChartData = useMemo(() => {
    return [...filtered]
      .sort(
        (a, b) =>
          SIGNAL_ORDER[a.genz_signal] - SIGNAL_ORDER[b.genz_signal] ||
          a.depth_ratio - b.depth_ratio
      )
      .map((r) => ({
        subcategory: r.subcategory.length > 20 ? r.subcategory.slice(0, 18) + "…" : r.subcategory,
        subcategoryFull: r.subcategory,
        category: r.category,
        depthRatio: +r.depth_ratio.toFixed(2),
        genz_signal: r.genz_signal,
        priority: r.assortment_priority,
      }));
  }, [filtered]);

  // Section 4 — Category avg depth: Shopsy vs Meesho
  const categoryDepthData = useMemo(() => {
    const catMap: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    assortment.forEach((r) => {
      const entry = (catMap[r.category] ??= { shopsy: [], meesho: [] });
      entry.shopsy.push(r.shopsy_depth_score);
      entry.meesho.push(r.meesho_depth_score);
    });
    return Object.entries(catMap)
      .map(([category, v]) => ({
        category,
        Shopsy: +(v.shopsy.reduce((a, b) => a + b, 0) / v.shopsy.length).toFixed(2),
        Meesho: +(v.meesho.reduce((a, b) => a + b, 0) / v.meesho.length).toFixed(2),
      }))
      .sort((a, b) => b.Meesho - a.Meesho);
  }, [assortment]);

  // Section 5 — Platform-unique subcategories from category_master
  const platformUnique = useMemo(() => {
    // Shopsy-only categories from taxonomy (from MD)
    const shopsyOnly = [
      { subcategory: "Sports, Health & Fitness", category: "Sports & Fitness", note: "Explicit top-level on Shopsy; Meesho folds into other sections" },
      { subcategory: "Automotive Accessories", category: "Automotive", note: "Shopsy-only top-level category" },
      { subcategory: "Gaming Accessories", category: "Electronics & Accessories", note: "Explicit on Shopsy; Meesho has no depth here" },
      { subcategory: "Computing & Connectivity", category: "Electronics & Accessories", note: "Shopsy leads via Flipkart electronics access" },
      { subcategory: "Small Appliances", category: "Home & Kitchen", note: "Shopsy depth 0.88 vs Meesho 0.40 — Flipkart moat" },
      { subcategory: "Personal Care Appliances", category: "Beauty & Personal Care", note: "Shopsy depth 0.88 vs Meesho 0.52 — grooming appliances advantage" },
    ];
    const meeshoOnly = [
      { subcategory: "Grocery", category: "Grocery", note: "Active top-level on Meesho; Shopsy has no equivalent" },
      { subcategory: "Bags & Luggage (standalone)", category: "Bags & Luggage", note: "Explicit top-level on Meesho; Shopsy folds into Accessories" },
      { subcategory: "Dress Materials", category: "Women's Ethnic Wear", note: "Meesho depth 0.88 vs Shopsy 0.45 — long-tail unstitched suits" },
      { subcategory: "Artificial Jewellery", category: "Jewellery & Accessories", note: "Meesho depth 0.96 vs Shopsy 0.65 — extremely high order volume, low AOV" },
      { subcategory: "Kitchen Tools & Gadgets", category: "Home & Kitchen", note: "Meesho depth 0.92 vs Shopsy 0.68 — viral chopper/organiser listings" },
    ];
    return { shopsyOnly, meeshoOnly };
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold">Assortment Intelligence</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Subcategory listing depth comparison — where Shopsy is under-assorted vs Meesho, prioritised by Gen Z signal
        </p>
      </div>

      {/* ── Section 1 — KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Critical Depth Gaps (ratio < 0.70)"
          value={String(criticalGapCount)}
          subtitle="subcategories"
          color="red"
          tooltip="Subcategories where Shopsy's listing depth score is below 70% of Meesho's — materially under-assorted."
        />
        <KPICard
          title="High Priority Gaps"
          value={String(highPriorityCount)}
          subtitle="high Gen Z demand, thin Shopsy listing"
          color="amber"
          tooltip="High or Very High Gen Z subcategories where Shopsy's catalogue is materially thinner than Meesho's — the cases where a listing gap is most likely to cost sales."
        />
        <KPICard
          title="Avg Depth Ratio"
          value={avgDepthRatio.toFixed(2) + "×"}
          subtitle="Shopsy ÷ Meesho"
          color={avgDepthRatio < 0.80 ? "amber" : "green"}
          tooltip="Average ratio of Shopsy listing depth to Meesho listing depth across all subcategories. 1.0 = parity."
        />
        <KPICard
          title="Shopsy Leads Depth"
          value={String(shopsyLeadsCount)}
          subtitle={`of ${assortment.length} subcategories`}
          color="green"
          tooltip="Subcategories where Shopsy's listing depth score equals or exceeds Meesho's. Primarily Electronics and Sports."
        />
      </div>

      {/* ── Section 2 — Depth Ratio Chart (primary viz) ──────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Depth Ratio Analysis — Sorted by Gen Z Signal
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
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
          <div className="flex gap-1.5 ml-2 border-l border-border pl-2">
            {(["All", "High", "Medium", "Low"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full h-7 text-xs px-3",
                  priorityFilter === p
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
                onClick={() => setPriorityFilter(p)}
              >
                {p === "All" ? "All Priority" : p}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shopsy ÷ Meesho Listing Depth Ratio</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ratio below 1.0 = Shopsy under-assorted vs Meesho. Red = critical (&lt;0.70). Reference line at 1.0 = parity.
              Sorted by Gen Z signal strength — highest Gen Z subcategories first.
            </p>
          </CardHeader>
          <CardContent>
            {depthRatioChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, depthRatioChartData.length * 28)}
              >
                <BarChart
                  data={depthRatioChartData}
                  layout="vertical"
                  margin={{ left: 170, right: 60, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 1.4]}
                    tickFormatter={(v: number) => v.toFixed(1) + "×"}
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="subcategory"
                    width={160}
                    fontSize={10}
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <RechartsTooltip
                    {...chartTooltipProps}
                    formatter={(val: number, _name: string, props: { payload?: { subcategoryFull?: string; category?: string; genz_signal?: GenZSignalLevel } }) => [
                      `${val.toFixed(2)}× — ${props.payload?.subcategoryFull ?? ""} (${props.payload?.category ?? ""}) · Gen Z: ${props.payload?.genz_signal ?? ""}`,
                      "Depth Ratio",
                    ]}
                  />
                  <ReferenceLine x={1.0} stroke="hsl(var(--border))" strokeDasharray="4 2" label={{ value: "Parity", position: "top", fontSize: 9 }} />
                  <Bar dataKey="depthRatio" radius={[0, 4, 4, 0]}>
                    {depthRatioChartData.map((entry, i) => (
                      <Cell key={i} fill={depthRatioColor(entry.depthRatio)} />
                    ))}
                    <LabelList
                      dataKey="depthRatio"
                      position="right"
                      fontSize={10}
                      formatter={(v: number) => v.toFixed(2) + "×"}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 3 — Subcategory Depth Table ─────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Subcategory Depth Detail</CardTitle>
          <p className="text-xs text-muted-foreground">
            All subcategories with depth scores, ratio, gap, and priority. Sorted by Gen Z signal then depth gap.
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2 overflow-x-auto">
          <div>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
                  <th className="text-left py-2.5 pl-4 pr-2 font-medium text-muted-foreground w-[165px]">Subcategory</th>
                  <th className="text-left py-2.5 pr-3 font-medium text-muted-foreground text-[10px]">Category</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Gen Z</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 mx-auto">
                          Shopsy Depth <HelpCircle className="h-3 w-3 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Shopsy's catalogue coverage in this subcategory as a % of Meesho's. 100% = parity; below 70% = materially under-assorted.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Meesho Depth</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 mx-auto">
                          Ratio <HelpCircle className="h-3 w-3 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Shopsy ÷ Meesho depth. Below 0.70 = Shopsy materially under-assorted.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-center py-2.5 pl-2 pr-4 font-medium text-muted-foreground">Priority</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No assortment data loaded yet.
                    </td>
                  </tr>
                ) : (
                  (showAllTable ? filtered : filtered.slice(0, TABLE_PREVIEW)).map((row) => (
                    <tr
                      key={`${row.category}-${row.subcategory}`}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-medium">{row.subcategory}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground text-[10px]">{row.category}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", GENZ_PILL[row.genz_signal])}>
                          {GENZ_LABEL[row.genz_signal]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold tabular-nums">
                        {row.meesho_depth_score > 0 ? Math.round((row.shopsy_depth_score / row.meesho_depth_score) * 100) + "%" : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold tabular-nums text-muted-foreground">
                        {Math.round(row.meesho_depth_score * 100) + "%"}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums", depthRatioBg(row.depth_ratio))}>
                          {row.depth_ratio.toFixed(2)}×
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-center">
                        {priorityBadge(row.assortment_priority)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > TABLE_PREVIEW && (
            <div className="px-4 pt-3 pb-1">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAllTable(v => !v)}>
                {showAllTable ? "Show fewer" : `Show all ${filtered.length} subcategories`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4 — Category Depth Chart ────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Assortment Depth</CardTitle>
          <p className="text-xs text-muted-foreground">
            Average listing depth per category — Shopsy vs Meesho. Higher = broader catalogue coverage in that category.
          </p>
        </CardHeader>
        <CardContent>
          {categoryDepthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, categoryDepthData.length * 34)}>
              <BarChart
                data={categoryDepthData}
                layout="vertical"
                margin={{ left: 160, right: 50, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => v.toFixed(1)} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={150}
                  fontSize={11}
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [v.toFixed(2), ""]} />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Shopsy" position="right" fontSize={10} formatter={(v: number) => v.toFixed(2)} />
                </Bar>
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="Meesho" position="right" fontSize={10} formatter={(v: number) => v.toFixed(2)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5 — Platform-Unique Category Gaps ───────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
          Structural Category Gaps
        </p>
        <div className="grid md:grid-cols-2 gap-4">

          {/* Shopsy Advantages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-700 dark:text-emerald-400">
                Shopsy Category Strengths
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Subcategories where Shopsy has structural depth Meesho cannot match
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {platformUnique.shopsyOnly.map((item) => (
                <div
                  key={item.subcategory}
                  className="flex items-start gap-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{item.subcategory}</p>
                    <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Meesho Advantages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Meesho Structural Advantages
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Subcategories where Meesho's depth lead is structural — not addressable by promotion alone
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {platformUnique.meeshoOnly.map((item) => (
                <div
                  key={item.subcategory}
                  className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{item.subcategory}</p>
                    <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
