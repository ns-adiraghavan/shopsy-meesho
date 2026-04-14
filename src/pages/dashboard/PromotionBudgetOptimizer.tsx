import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { datasets, type PromotionROIRecord } from "@/data/dataLoader";
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString("en-IN");

function promoBadge(type: string) {
  switch (type) {
    case "Flash Sale":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">🔥 Flash Sale</Badge>;
    case "Coupon":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">🎟️ Coupon</Badge>;
    default:
      return <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">🏷️ {type}</Badge>;
  }
}

function genzBadge(score: number) {
  if (score > 85) return <span className="text-red-600 dark:text-red-400 font-medium">{score.toFixed(0)}</span>;
  if (score > 70) return <span className="text-amber-600 dark:text-amber-400 font-medium">{score.toFixed(0)}</span>;
  if (score > 0) return <span>{score.toFixed(0)}</span>;
  return <span className="text-muted-foreground">{"\u2014"}</span>;
}

function KPISimple({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: "red" | "green" | "amber" }) {
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
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

const CATEGORY_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(199, 89%, 48%)",
  "hsl(340, 82%, 52%)", "hsl(25, 95%, 53%)", "hsl(173, 80%, 40%)",
  "hsl(47, 100%, 50%)",
];

/* ------------------------------------------------------------------ */
/*  SKU row renderer                                                  */
/* ------------------------------------------------------------------ */

interface RowData {
  rank: number;
  name: string;
  brand: string;
  category: string;
  promoType: string;
  discount: number;
  shopsyPrice: number;
  meeshoPrice: number;
  gapPct: number;
  genzScore: number;
  demandScore: number;
  gmvUplift: number;
}

function buildRow(r: PromotionROIRecord, rank: number, nameMap: Record<string, string>): RowData {
  return {
    rank,
    name: nameMap[r.sku_id] || r.normalized_name || r.sku_id,
    brand: r.brand,
    category: r.category,
    promoType: r.recommended_promo_type,
    discount: r.recommended_discount_depth,
    shopsyPrice: r.sale_price,
    meeshoPrice: r.competitor_price,
    gapPct: r.price_gap_pct,
    genzScore: r.genz_traction_score,
    demandScore: r.demand_intensity_score,
    gmvUplift: r.estimated_gmv_uplift,
  };
}

function SKUTable({ rows, showDisclaimer }: { rows: RowData[]; showDisclaimer?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {["#", "Product", "Brand", "Category", "Promo Type", "Disc. %", "\u20B9 Shopsy", "\u20B9 Meesho", "Gap %", "Gen Z", "Demand", "GMV Uplift*"].map((h) => (
              <th key={h} className="text-left py-2 px-1.5 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={12} className="py-6 text-center text-muted-foreground">No SKUs to display.</td></tr>
          ) : rows.map((r) => (
            <tr key={r.rank} className="border-b border-border/40 hover:bg-muted/30">
              <td className="py-1.5 px-1.5 text-muted-foreground">{r.rank}</td>
              <td className="py-1.5 px-1.5 max-w-[160px] truncate font-medium">{r.name}</td>
              <td className="py-1.5 px-1.5">{r.brand}</td>
              <td className="py-1.5 px-1.5">{r.category}</td>
              <td className="py-1.5 px-1.5">{promoBadge(r.promoType)}</td>
              <td className="py-1.5 px-1.5">{r.discount.toFixed(0)}%</td>
              <td className="py-1.5 px-1.5">{"\u20B9"}{r.shopsyPrice.toFixed(0)}</td>
              <td className="py-1.5 px-1.5">{"\u20B9"}{r.meeshoPrice.toFixed(0)}</td>
              <td className={cn("py-1.5 px-1.5 font-medium", r.gapPct > 5 ? "text-red-600 dark:text-red-400" : r.gapPct < -1 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                {r.gapPct > 0 ? "+" : ""}{r.gapPct.toFixed(1)}%
              </td>
              <td className="py-1.5 px-1.5">{genzBadge(r.genzScore)}</td>
              <td className="py-1.5 px-1.5">{r.demandScore.toFixed(0)}</td>
              <td className="py-1.5 px-1.5">{"\u20B9"}{fmt(Math.round(r.gmvUplift))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showDisclaimer && (
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          *GMV uplift figures are synthetic benchmarks for demo purposes. Replace with Shopsy&apos;s actual conversion data for production.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function PromotionBudgetOptimizer() {
  const [budgetInput, setBudgetInput] = useState("500000");
  const [allocated, setAllocated] = useState<RowData[] | null>(null);
  const [allocBudget, setAllocBudget] = useState(0);
  const [allocCost, setAllocCost] = useState(0);

  const skuNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.skuMaster.forEach((s) => { m[s.sku_id] = s.normalized_name; });
    return m;
  }, []);

  const eligible = useMemo(
    () => datasets.promotionROI
      .filter((r) => r.availability_flag === 1)
      .sort((a, b) => b.promotion_roi_score - a.promotion_roi_score),
    []
  );

  /* Top 20 leaderboard (always visible) */
  const leaderboard = useMemo(
    () => eligible.slice(0, 20).map((r, i) => buildRow(r, i + 1, skuNameMap)),
    [eligible, skuNameMap]
  );

  /* Allocation handler */
  const runAllocation = () => {
    const budget = parseFloat(budgetInput) || 0;
    if (budget <= 0) return;
    let cumulative = 0;
    const result: RowData[] = [];
    for (let i = 0; i < eligible.length; i++) {
      const r = eligible[i];
      const cost = (r.sale_price * r.recommended_discount_depth / 100) * 10;
      if (cumulative + cost > budget) continue; // skip if single SKU exceeds remaining
      cumulative += cost;
      result.push(buildRow(r, result.length + 1, skuNameMap));
      if (cumulative >= budget) break;
    }
    setAllocated(result);
    setAllocBudget(budget);
    setAllocCost(cumulative);
  };

  /* Summary metrics */
  const summaryCards = useMemo(() => {
    if (!allocated) return null;
    const totalGMV = allocated.reduce((s, r) => s + r.gmvUplift, 0);
    const avgROI = allocated.length > 0
      ? eligible.filter((_, i) => i < allocated.length).reduce((s, r) => s + r.promotion_roi_score, 0) / allocated.length
      : 0;
    const utilisation = allocBudget > 0 ? (allocCost / allocBudget) * 100 : 0;
    return { count: allocated.length, totalGMV, avgROI, utilisation };
  }, [allocated, eligible, allocBudget, allocCost]);

  /* Category breakdown for donut */
  const categoryBreakdown = useMemo(() => {
    if (!allocated) return [];
    const map: Record<string, number> = {};
    // Rebuild cost per allocated SKU
    let idx = 0;
    for (const r of eligible) {
      if (idx >= (allocated?.length ?? 0)) break;
      const cost = (r.sale_price * r.recommended_discount_depth / 100) * 10;
      map[r.category] = (map[r.category] ?? 0) + cost;
      idx++;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [allocated, eligible]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <h1 className="text-lg font-semibold">Promotion Budget Optimizer</h1>

      {/* Section 1 — Budget Input */}
      <Card
        className="border border-primary/20"
        style={{ background: "linear-gradient(135deg, hsl(348 85% 58% / 0.06), hsl(280 70% 62% / 0.06))" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Where should Shopsy spend?</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your promotion budget and we&apos;ll rank every eligible SKU by expected GMV return per rupee.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Total Promotion Budget ({"\u20B9"})</label>
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-[200px] h-9"
                min={0}
              />
            </div>
            <Button
              onClick={runAllocation}
              className="h-9 px-6 font-semibold text-white"
              style={{ background: "linear-gradient(to right, hsl(348 85% 58%), hsl(280 70% 62%))" }}
            >
              Allocate Budget
            </Button>
          </div>
          {!allocated && (
            <p className="text-xs text-muted-foreground mt-3">
              {eligible.length} Shopsy SKUs ranked by Promotion ROI Score · OOS SKUs automatically excluded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3 — Summary Cards (after allocation) */}
      {summaryCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPISimple title="SKUs Allocated" value={summaryCards.count.toString()} color="green" />
          <KPISimple title="Est. GMV Uplift" value={`\u20B9${fmt(Math.round(summaryCards.totalGMV))}`} subtitle="Synthetic benchmark" color="amber" />
          <KPISimple title="Budget Utilisation" value={`${summaryCards.utilisation.toFixed(1)}%`} />
          <KPISimple title="Avg ROI Score" value={summaryCards.avgROI.toFixed(1)} />
        </div>
      )}

      {/* Section 2 — Allocation Results */}
      {allocated && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Your Promotion Plan &mdash; {allocated.length} SKUs across {"\u20B9"}{fmt(allocBudget)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SKUTable rows={allocated} showDisclaimer />
          </CardContent>
        </Card>
      )}

      {/* Section 4 — Category Donut (after allocation) */}
      {allocated && categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Split by Category</CardTitle>
            <p className="text-xs text-muted-foreground">Estimated promotion cost distribution across allocated SKUs</p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={10}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v: number) => [`\u20B9${fmt(v)}`, "Est. Cost"]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Section 5 — Pre-allocation Leaderboard (always visible) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 20 SKUs by Promotion ROI Score</CardTitle>
          <p className="text-xs text-muted-foreground">Ranked by pre-computed ROI score, independent of budget input</p>
        </CardHeader>
        <CardContent>
          <SKUTable rows={leaderboard} showDisclaimer />
        </CardContent>
      </Card>

      {/* Section A — Category Allocation Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GMV Uplift Potential by Category</CardTitle>
            <p className="text-xs text-muted-foreground">Across all promotion-eligible SKUs, ranked by estimated impact</p>
          </CardHeader>
          <CardContent>
            {(() => {
              const catMap: Record<string, number> = {};
              eligible.forEach((r) => { catMap[r.category] = (catMap[r.category] ?? 0) + r.estimated_gmv_uplift; });
              const catData = Object.entries(catMap)
                .map(([category, uplift]) => ({ category, uplift: Math.round(uplift) }))
                .sort((a, b) => b.uplift - a.uplift);
              return catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(280, catData.length * 36)}>
                  <BarChart data={catData} layout="vertical" margin={{ left: 140, right: 60, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} fontSize={11} />
                    <YAxis type="category" dataKey="category" width={130} fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} />
                    <RechartsTooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "GMV Uplift"]} />
                    <Bar dataKey="uplift" radius={[0, 4, 4, 0]}>
                      {catData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                      <LabelList dataKey="uplift" position="right" fontSize={10} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">No eligible SKUs.</p>;
            })()}
          </CardContent>
        </Card>

        {/* Section B — Promo Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended Promo Mix</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution of promo types across ROI-ranked SKUs</p>
          </CardHeader>
          <CardContent className="flex justify-center">
            {(() => {
              const typeMap: Record<string, number> = {};
              eligible.forEach((r) => { typeMap[r.recommended_promo_type] = (typeMap[r.recommended_promo_type] ?? 0) + 1; });
              const typeData = Object.entries(typeMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
              return typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      fontSize={10}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v: number) => [v, "SKUs"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">No eligible SKUs.</p>;
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Section C — Brand Concentration Alert */}
      {(() => {
        const top20 = leaderboard.slice(0, 20);
        const brandMap: Record<string, number> = {};
        top20.forEach((r) => { brandMap[r.brand] = (brandMap[r.brand] ?? 0) + 1; });
        const dominant = Object.entries(brandMap).find(([, count]) => count / top20.length > 0.3);
        if (dominant) {
          return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">⚠️ {dominant[0]} accounts for {dominant[1]} of the top 20 promotion slots — consider diversifying budget across brands to reduce dependency.</p>
            </div>
          );
        }
        return (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">✓ Budget is well-distributed across brands in the top 20.</p>
          </div>
        );
      })()}
    </div>
  );
}
