import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { datasets } from "@/data/dataLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function gapColor(gap: number): string {
  if (gap > 5) return "hsl(0, 72%, 51%)";
  if (gap < -1) return "hsl(142, 71%, 45%)";
  return "hsl(38, 92%, 50%)";
}

function actionLabel(gap: number): { text: string; variant: "destructive" | "default" | "secondary" | "outline" } {
  if (gap > 10) return { text: "Flash Sale", variant: "destructive" };
  if (gap >= 5) return { text: "Coupon", variant: "default" };
  if (gap >= 0) return { text: "Monitor", variant: "secondary" };
  return { text: "Hold", variant: "outline" };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function PricingPromoIntelligence() {
  const [promoFilterPlatform, setPromoFilterPlatform] = useState("Both");
  const [promoFilterCategory, setPromoFilterCategory] = useState("All");
  const [promoPage, setPromoPage] = useState(0);

  /* ---------- derived data ---------- */

  const LATEST_DATE = useMemo(() => datasets.priceTracking.reduce((max, r) => r.date > max ? r.date : max, ""), []);

  const latestRows = useMemo(
    () => datasets.priceTracking.filter((r) => r.date === LATEST_DATE),
    [LATEST_DATE]
  );

  const shopsyRows = useMemo(() => latestRows.filter((r) => r.platform === "Shopsy"), [latestRows]);
  const meeshoRows = useMemo(() => latestRows.filter((r) => r.platform === "Meesho"), [latestRows]);

  // KPI 1 — overpriced count
  const overpricedCount = useMemo(() => shopsyRows.filter((r) => r.price_gap_pct > 0).length, [shopsyRows]);

  // KPI 2 — avg price gap
  const avgGap = useMemo(() => avg(shopsyRows.map((r) => r.price_gap_pct)), [shopsyRows]);

  // KPI 3 — Meesho promo rate
  const meeshoPromoRate = useMemo(() => avg(meeshoRows.map((r) => r.promotion_flag)) * 100, [meeshoRows]);

  // KPI 4 — Shopsy promo rate
  const shopsyPromoRate = useMemo(() => avg(shopsyRows.map((r) => r.promotion_flag)) * 100, [shopsyRows]);

  // Section 2 — category price gap
  const categoryGapData = useMemo(() => {
    const map: Record<string, number[]> = {};
    shopsyRows.forEach((r) => {
      (map[r.category] ??= []).push(r.price_gap_pct);
    });
    return Object.entries(map)
      .map(([category, gaps]) => ({ category, gap: +avg(gaps).toFixed(1) }))
      .sort((a, b) => b.gap - a.gap);
  }, [shopsyRows]);

  // Section 3 — promo rate by category per platform
  const promoByCategory = useMemo(() => {
    const build = (rows: typeof latestRows) => {
      const map: Record<string, number[]> = {};
      rows.forEach((r) => {
        (map[r.category] ??= []).push(r.promotion_flag);
      });
      return Object.entries(map)
        .map(([category, flags]) => ({ category, rate: +(avg(flags) * 100).toFixed(1) }))
        .sort((a, b) => b.rate - a.rate);
    };
    return { meesho: build(meeshoRows), shopsy: build(shopsyRows) };
  }, [meeshoRows, shopsyRows]);

  // Section 4 — active promos
  const categories = useMemo(() => {
    const s = new Set(latestRows.map((r) => r.category));
    return Array.from(s).sort();
  }, [latestRows]);

  const filteredPromos = useMemo(() => {
    let rows = latestRows.filter((r) => r.promotion_flag === 1);
    if (promoFilterPlatform !== "Both") rows = rows.filter((r) => r.platform === promoFilterPlatform);
    if (promoFilterCategory !== "All") rows = rows.filter((r) => r.category === promoFilterCategory);
    return rows.sort((a, b) => b.discount_percent - a.discount_percent);
  }, [latestRows, promoFilterPlatform, promoFilterCategory]);

  const promoPageCount = Math.max(1, Math.ceil(filteredPromos.length / PAGE_SIZE));
  const pagedPromos = filteredPromos.slice(promoPage * PAGE_SIZE, (promoPage + 1) * PAGE_SIZE);

  // Section 5 — SKU benchmark
  const skuNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.skuMaster.forEach((s) => {
      m[s.sku_id] = s.normalized_name;
    });
    return m;
  }, []);

  const skuBenchmark = useMemo(() => {
    const meeshoPriceMap: Record<string, number> = {};
    meeshoRows.forEach((r) => {
      meeshoPriceMap[r.sku_id] = r.sale_price;
    });
    return shopsyRows
      .map((r) => ({
        sku_id: r.sku_id,
        name: skuNameMap[r.sku_id] || r.sku_id,
        category: r.category,
        shopsyPrice: r.sale_price,
        meeshoPrice: meeshoPriceMap[r.sku_id] ?? null,
        gap: r.price_gap_pct,
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 100);
  }, [shopsyRows, meeshoRows, skuNameMap]);

  /* ---------- render ---------- */

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <h1 className="text-lg font-semibold">Pricing &amp; Promotions Intelligence</h1>

      {/* Section 1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPISimple title="SKUs Where Shopsy Overpriced" value={overpricedCount.toString()} subtitle={`of ${shopsyRows.length} SKUs`} color="red" tooltip="Number of SKUs where Shopsy's sale price is higher than Meesho's equivalent, as of the latest date" />
        <KPISimple title="Avg Price Gap (Shopsy vs Meesho)" value={`${avgGap >= 0 ? "+" : ""}${avgGap.toFixed(1)}%`} color={avgGap > 0 ? "red" : "green"} tooltip="Average percentage difference between Shopsy and Meesho sale prices. Positive = Shopsy is more expensive" />
        <KPISimple title="Meesho Active Promo Rate" value={`${meeshoPromoRate.toFixed(1)}%`} color="amber" tooltip="Percentage of Meesho SKUs currently running an active promotion (coupon, flash sale, or markdown)" />
        <KPISimple title="Shopsy Active Promo Rate" value={`${shopsyPromoRate.toFixed(1)}%`} tooltip="Percentage of Shopsy SKUs currently running an active promotion" />
      </div>

      {/* Section 2 — Category Price Gap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Price Competitiveness</CardTitle>
          <p className="text-xs text-muted-foreground">Avg price gap % by category (Shopsy vs Meesho). Red = overpriced, Green = cheaper.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(280, categoryGapData.length * 32)}>
            <BarChart data={categoryGapData} layout="vertical" margin={{ left: 140, right: 40, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="category" width={130} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
              <RechartsTooltip formatter={(v: number) => [`${v}%`, "Avg Gap"]} />
              <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
                {categoryGapData.map((entry, i) => (
                  <Cell key={i} fill={gapColor(entry.gap)} />
                ))}
                <LabelList dataKey="gap" position="right" fontSize={10} formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 3 — Promo Gap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Promotion Gap: Meesho is out-promoting Shopsy across all categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Meesho Promo Rate by Category</p>
              <ResponsiveContainer width="100%" height={Math.max(240, promoByCategory.meesho.length * 30)}>
                <BarChart data={promoByCategory.meesho} layout="vertical" margin={{ left: 130, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="category" width={120} fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Bar dataKey="rate" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="rate" position="right" fontSize={10} formatter={(v: number) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Shopsy Promo Rate by Category</p>
              <ResponsiveContainer width="100%" height={Math.max(240, promoByCategory.shopsy.length * 30)}>
                <BarChart data={promoByCategory.shopsy} layout="vertical" margin={{ left: 130, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="category" width={120} fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Bar dataKey="rate" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="rate" position="right" fontSize={10} formatter={(v: number) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Active Promotions Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Active Promotions Tracker</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={promoFilterPlatform} onValueChange={(v) => { setPromoFilterPlatform(v); setPromoPage(0); }}>
                <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Shopsy">Shopsy</SelectItem>
                  <SelectItem value="Meesho">Meesho</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <Button variant="ghost" size="sm" className={cn("rounded-full h-7 text-xs px-3 shrink-0", promoFilterCategory === "All" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted/70")} onClick={() => { setPromoFilterCategory("All"); setPromoPage(0); }}>All</Button>
                {categories.map((c) => (
                  <Button key={c} variant="ghost" size="sm" className={cn("rounded-full h-7 text-xs px-3 shrink-0", promoFilterCategory === c ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted/70")} onClick={() => { setPromoFilterCategory(c); setPromoPage(0); }}>{c}</Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["SKU ID", "Category", "Brand", "Platform", "Promo Type", "Discount %", "Price Gap %"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedPromos.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No active promotions found.</td></tr>
              ) : pagedPromos.map((r, i) => (
                <tr key={`${r.sku_id}-${r.platform}-${i}`} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-mono">{r.sku_id}</td>
                  <td className="py-1.5 px-2">{r.category}</td>
                  <td className="py-1.5 px-2">{r.brand}</td>
                  <td className="py-1.5 px-2">
                    <Badge variant={r.platform === "Shopsy" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{r.platform}</Badge>
                  </td>
                  <td className="py-1.5 px-2">{r.promotion_type || "\u2014"}</td>
                  <td className="py-1.5 px-2">{r.discount_percent.toFixed(1)}%</td>
                  <td className={cn("py-1.5 px-2 font-medium", r.price_gap_pct > 5 ? "text-red-600 dark:text-red-400" : r.price_gap_pct < -1 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                    {r.price_gap_pct > 0 ? "+" : ""}{r.price_gap_pct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {promoPageCount > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-[10px] text-muted-foreground">{filteredPromos.length} rows &middot; Page {promoPage + 1} of {promoPageCount}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={promoPage === 0} onClick={() => setPromoPage((p) => p - 1)}><ChevronLeft className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={promoPage >= promoPageCount - 1} onClick={() => setPromoPage((p) => p + 1)}><ChevronRight className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — SKU Benchmark */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">SKU-Level Detail</p>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SKU-Level Price Benchmark</CardTitle>
          <p className="text-xs text-muted-foreground">Shopsy rows, latest date, sorted by price gap descending</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["SKU ID", "Product Name", "Category", "Shopsy Price", "Meesho Price", "Gap %", "Action"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skuBenchmark.map((r, i) => {
                const action = actionLabel(r.gap);
                return (
                  <tr key={`${r.sku_id}-${i}`} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-mono">{r.sku_id}</td>
                    <td className="py-1.5 px-2 max-w-[200px] truncate">{r.name}</td>
                    <td className="py-1.5 px-2">{r.category}</td>
                    <td className="py-1.5 px-2">{"\u20B9"}{r.shopsyPrice.toFixed(0)}</td>
                    <td className="py-1.5 px-2">{r.meeshoPrice !== null ? `\u20B9${r.meeshoPrice.toFixed(0)}` : "\u2014"}</td>
                    <td className={cn("py-1.5 px-2 font-medium", r.gap > 5 ? "text-red-600 dark:text-red-400" : r.gap < -1 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                      {r.gap > 0 ? "+" : ""}{r.gap.toFixed(1)}%
                    </td>
                    <td className="py-1.5 px-2">
                      <Badge variant={action.variant} className="text-[10px] px-1.5 py-0">{action.text}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Simple KPI card (local)                                           */
/* ------------------------------------------------------------------ */

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
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}