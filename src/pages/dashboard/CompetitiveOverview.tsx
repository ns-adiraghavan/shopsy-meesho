// @ts-nocheck
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useOutletContext } from "react-router-dom";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import {
  GlobalFilters,
  getPriceData,
  getAvailabilityData,
  getSearchData,
  getAssortmentData,
  datasets,
} from "@/data/dataLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

// ─── Price gap helpers ────────────────────────────────────────────────────────
function computePriceGapByPlatform(
  priceData: ReturnType<typeof getPriceData>
): Record<string, number> {
  const skuAvg: Record<string, { sum: number; count: number }> = {};
  for (const row of priceData) {
    if (!skuAvg[row.sku_id]) skuAvg[row.sku_id] = { sum: 0, count: 0 };
    skuAvg[row.sku_id].sum += row.sale_price;
    skuAvg[row.sku_id].count++;
  }

  const platformGap: Record<string, { sum: number; count: number }> = {};
  for (const row of priceData) {
    const avg = skuAvg[row.sku_id];
    if (!avg || avg.count === 0) continue;
    const avgPrice = avg.sum / avg.count;
    if (avgPrice === 0) continue;
    const gap = ((row.sale_price - avgPrice) / avgPrice) * 100;
    if (!platformGap[row.platform]) platformGap[row.platform] = { sum: 0, count: 0 };
    platformGap[row.platform].sum += gap;
    platformGap[row.platform].count++;
  }

  const result: Record<string, number> = {};
  for (const [platform, { sum, count }] of Object.entries(platformGap)) {
    result[platform] = count > 0 ? sum / count : 0;
  }
  return result;
}

const CompetitiveOverview = () => {
  const filters = useOutletContext<GlobalFilters>();

  const priceData = useMemo(() => getPriceData(filters), [filters]);
  const availData = useMemo(() => getAvailabilityData(filters), [filters]);
  const searchData = useMemo(() => getSearchData(filters), [filters]);
  const assortmentData = useMemo(() => getAssortmentData(filters), [filters]);

  // Build SKU master lookup: sku_id → product_name and is_regional
  const skuNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sku of datasets.skuMaster) {
      map[sku.sku_id] = sku.product_name;
    }
    return map;
  }, []);

  const skuRegionalMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const sku of datasets.skuMaster) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map[sku.sku_id] = Boolean((sku as any).is_regional);
    }
    return map;
  }, []);

  const priceGapByPlatform = useMemo(() => computePriceGapByPlatform(priceData), [priceData]);

  const availByPlatform = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const row of availData) {
      if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
      totals[row.platform].sum += row.availability_flag;
      totals[row.platform].count++;
    }
    const result: Record<string, number> = {};
    for (const [p, { sum, count }] of Object.entries(totals)) {
      result[p] = count > 0 ? (sum / count) * 100 : 0;
    }
    return result;
  }, [availData]);

  const searchByPlatform = useMemo(() => {
    const totals: Record<string, { page1: number; total: number }> = {};
    for (const row of searchData) {
      if (!totals[row.platform]) totals[row.platform] = { page1: 0, total: 0 };
      totals[row.platform].total++;
      if (row.search_rank <= 10) totals[row.platform].page1++;
    }
    const result: Record<string, number> = {};
    for (const [p, { page1, total }] of Object.entries(totals)) {
      result[p] = total > 0 ? (page1 / total) * 100 : 0;
    }
    return result;
  }, [searchData]);

  const assortByPlatform = useMemo(() => {
    const totals: Record<string, { listed: number; total: number }> = {};
    for (const row of assortmentData) {
      if (!totals[row.platform]) totals[row.platform] = { listed: 0, total: 0 };
      totals[row.platform].total++;
      if (row.listing_status === 1) totals[row.platform].listed++;
    }
    const result: Record<string, number> = {};
    for (const [p, { listed, total }] of Object.entries(totals)) {
      result[p] = total > 0 ? (listed / total) * 100 : 0;
    }
    return result;
  }, [assortmentData]);

  const platformScores = useMemo(() => {
    return PLATFORMS.map((platform) => {
      const gap = priceGapByPlatform[platform] ?? 0;
      const priceComp = Math.max(0, Math.min(100, 100 - Math.abs(gap) * 2));
      const avail = availByPlatform[platform] ?? 0;
      const search = searchByPlatform[platform] ?? 0;
      const assort = assortByPlatform[platform] ?? 0;
      const score = Math.round(priceComp * 0.35 + avail * 0.25 + search * 0.20 + assort * 0.20);
      return { platform, score, priceComp, avail, search, assort, gap };
    });
  }, [priceGapByPlatform, availByPlatform, searchByPlatform, assortByPlatform]);


  // ── Zepto row from platform_summary (source of truth for KPI cards) ──────
  const zeptoPlatformSummary = useMemo(
    () => datasets.platformSummary.find((p) => p.platform === "Zepto") ?? null,
    []
  );

  // Availability Rate: % of Zepto observations where availability_flag = 1
  const avgAvailabilityRate = useMemo(() => {
    const zeptoRows = availData.filter((r) => r.platform === "Zepto");
    if (zeptoRows.length === 0) return 0;
    const inStock = zeptoRows.filter((r) => r.availability_flag === 1).length;
    return (inStock / zeptoRows.length) * 100;
  }, [availData]);

  // Search Visibility: % of Zepto search observations where search_rank <= 10
  const avgSearchVisibility = useMemo(() => {
    const zeptoRows = searchData.filter((r) => r.platform === "Zepto");
    if (zeptoRows.length === 0) return 0;
    const top10 = zeptoRows.filter((r) => r.search_rank <= 10).length;
    return (top10 / zeptoRows.length) * 100;
  }, [searchData]);

  const skuCoverage = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summaryCount = zeptoPlatformSummary ? (zeptoPlatformSummary as any).sku_count : undefined;
    if (typeof summaryCount === "number") return summaryCount;
    const listedIds = new Set<string>();
    for (const row of assortmentData) {
      if (row.listing_status === 1) listedIds.add(row.sku_id);
    }
    return listedIds.size;
  }, [zeptoPlatformSummary, assortmentData]);

  const top10PresenceForInsights = PLATFORMS
    .map((p) => ({ platform: p, pct: searchByPlatform[p] ?? 0 }))
    .sort((a, b) => b.pct - a.pct)[0] ?? { platform: "—", pct: 0 };

  const liveKPIs = [
    {
      title: "Availability Rate",
      value: `${avgAvailabilityRate.toFixed(1)}%`,
      trend: avgAvailabilityRate >= 85 ? ("up" as const) : avgAvailabilityRate >= 70 ? ("neutral" as const) : ("down" as const),
      status: avgAvailabilityRate >= 85 ? ("low" as const) : avgAvailabilityRate >= 70 ? ("medium" as const) : ("high" as const),
      tooltip: "Availability Rate: Zepto SKU availability rate from platform_summary. Falls back to inline average across all platforms if summary data is unavailable.",
    },
    {
      title: "Search Visibility",
      value: `${avgSearchVisibility.toFixed(1)}%`,
      trend: avgSearchVisibility >= 80 ? ("up" as const) : ("neutral" as const),
      status: avgSearchVisibility >= 80 ? ("low" as const) : ("medium" as const),
      tooltip: "Search Visibility: Zepto Top-10 search presence % from platform_summary. Falls back to cross-platform average if summary data is unavailable.",
    },
    {
      title: "Selection Coverage",
      value: skuCoverage.toLocaleString(),
      trend: "neutral" as const,
      status: "low" as const,
      tooltip: "Selection Coverage: Zepto SKU count from platform_summary. Falls back to distinct listed SKUs from assortment_tracking if unavailable.",
    },
  ];

  const heatmapData = useMemo(() => {
    const catPlatAvg: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const row of priceData) {
      if (!catPlatAvg[row.category]) catPlatAvg[row.category] = {};
      if (!catPlatAvg[row.category][row.platform])
        catPlatAvg[row.category][row.platform] = { sum: 0, count: 0 };
      catPlatAvg[row.category][row.platform].sum += row.sale_price;
      catPlatAvg[row.category][row.platform].count++;
    }
    return Object.entries(catPlatAvg)
      .map(([category, platMap]) => {
        let totalSum = 0, totalCount = 0;
        for (const { sum, count } of Object.values(platMap)) { totalSum += sum; totalCount += count; }
        const categoryAvg = totalCount > 0 ? totalSum / totalCount : 0;
        const platforms = PLATFORMS.map((p) => {
          const d = platMap[p];
          const platAvg = d ? d.sum / d.count : categoryAvg;
          const priceGap = categoryAvg > 0 ? ((platAvg - categoryAvg) / categoryAvg) * 100 : 0;
          return { name: p, priceGap: parseFloat(priceGap.toFixed(1)) };
        });
        return { category, platforms };
      })
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [priceData]);

  const heatmapCellColor = (gap: number) => {
    if (gap <= -5) return "bg-status-low";
    if (gap <= 5) return "bg-status-medium";
    if (gap <= 15) return "bg-status-high";
    return "bg-status-critical";
  };
  const heatmapLabel = (gap: number) => {
    if (gap <= -5) return "Competitive";
    if (gap <= 5) return "Moderate";
    if (gap <= 15) return "At Risk";
    return "Critical";
  };

  const topPriceGapSKUs = useMemo(() => {
    const skuAvg: Record<string, { sum: number; count: number; category: string }> = {};
    for (const row of priceData) {
      if (!skuAvg[row.sku_id]) skuAvg[row.sku_id] = { sum: 0, count: 0, category: row.category };
      skuAvg[row.sku_id].sum += row.sale_price;
      skuAvg[row.sku_id].count++;
    }
    const skuPlatAvg: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const row of priceData) {
      if (!skuPlatAvg[row.sku_id]) skuPlatAvg[row.sku_id] = {};
      if (!skuPlatAvg[row.sku_id][row.platform]) skuPlatAvg[row.sku_id][row.platform] = { sum: 0, count: 0 };
      skuPlatAvg[row.sku_id][row.platform].sum += row.sale_price;
      skuPlatAvg[row.sku_id][row.platform].count++;
    }
    const items: { sku_id: string; product_name: string; category: string; platform: string; platformPrice: number; competitorAvg: number; gapPct: number; }[] = [];
    for (const [skuId, platMap] of Object.entries(skuPlatAvg)) {
      const meta = skuAvg[skuId];
      if (!meta) continue;
      const overallAvg = meta.sum / meta.count;
      // Resolve name from SKU master; fall back to sku_id only if truly missing
      const product_name = skuNameMap[skuId] ?? skuId;
      for (const [platform, { sum, count }] of Object.entries(platMap)) {
        const platAvg = sum / count;
        if (overallAvg === 0) continue;
        const gapPct = ((platAvg - overallAvg) / overallAvg) * 100;
        if (gapPct > 0) items.push({ sku_id: skuId, product_name, category: meta.category, platform, platformPrice: platAvg, competitorAvg: overallAvg, gapPct });
      }
    }
    return items.sort((a, b) => b.gapPct - a.gapPct).slice(0, 10);
  }, [priceData, skuNameMap]);

  const categoryPricePressure = useMemo(() => {
    const catData: Record<string, { zeptoSum: number; zeptoCount: number; compSum: number; compCount: number }> = {};
    for (const row of priceData) {
      if (!catData[row.category]) catData[row.category] = { zeptoSum: 0, zeptoCount: 0, compSum: 0, compCount: 0 };
      if (row.platform === "Zepto") { catData[row.category].zeptoSum += row.sale_price; catData[row.category].zeptoCount++; }
      else { catData[row.category].compSum += row.sale_price; catData[row.category].compCount++; }
    }
    return Object.entries(catData)
      .filter(([, d]) => d.zeptoCount > 0 && d.compCount > 0)
      .map(([category, d]) => {
        const zeptoAvg = d.zeptoSum / d.zeptoCount;
        const compAvg = d.compSum / d.compCount;
        const gapPct = parseFloat(((compAvg - zeptoAvg) / zeptoAvg * 100).toFixed(1));
        return { category, zepto_avg_price: parseFloat(zeptoAvg.toFixed(2)), competitor_avg_price: parseFloat(compAvg.toFixed(2)), price_gap_pct: gapPct };
      })
      .sort((a, b) => Math.abs(b.price_gap_pct) - Math.abs(a.price_gap_pct));
  }, [priceData]);

  const getRiskLevel = (gap: number): "Critical" | "High" | "Medium" | "Low" => {
    if (gap > 15) return "Critical";
    if (gap > 10) return "High";
    if (gap > 5) return "Medium";
    return "Low";
  };
  const getRiskColor = (risk: "Critical" | "High" | "Medium" | "Low") => {
    switch (risk) {
      case "Critical": return "text-status-critical bg-status-critical/10 border-status-critical/20";
      case "High": return "text-status-high bg-status-high/10 border-status-high/20";
      case "Medium": return "text-status-medium bg-status-medium/10 border-status-medium/20";
      default: return "text-status-low bg-status-low/10 border-status-low/20";
    }
  };

  // ── Strategic Insights ────────────────────────────────────────────────────
  const insights: Insight[] = useMemo(() => {
    const list: Insight[] = [];
    const topScore = [...platformScores].sort((a, b) => b.score - a.score)[0];
    if (topScore) list.push({ icon: "zap", title: "Competitiveness Leader", body: `${topScore.platform} leads with a composite score of ${topScore.score}/100 across price, availability, search, and assortment metrics.`, type: "positive" });

    const highGapSku = topPriceGapSKUs[0];
    if (highGapSku) list.push({ icon: "trend-down", title: "Top Price Risk SKU", body: `"${highGapSku.product_name}" on ${highGapSku.platform} has a +${highGapSku.gapPct.toFixed(1)}% price gap vs the category average — highest exposure in the current filter.`, type: "warning" });

    if (top10PresenceForInsights.pct > 0) list.push({ icon: "search", title: "Search Presence Leader", body: `${top10PresenceForInsights.platform} leads Top-10 search visibility at ${top10PresenceForInsights.pct.toFixed(1)}% across tracked keywords.`, type: "positive" });
    return list;
  }, [platformScores, topPriceGapSKUs, top10PresenceForInsights]);

  const platformCompData = platformScores.map((p) => ({
    platform: p.platform,
    Score: p.score,
    "Price Comp": parseFloat(p.priceComp.toFixed(1)),
    Availability: parseFloat(p.avail.toFixed(1)),
    Search: parseFloat(p.search.toFixed(1)),
    Assortment: parseFloat(p.assort.toFixed(1)),
  }));

  const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Competitive Intelligence Overview</h1>
          <p className="text-sm text-muted-foreground">
            Cross-platform performance across price, availability, search, and assortment
          </p>
        </div>
      </div>

      <PageControlBar exportLabel="competitive_overview" exportData={priceData as unknown as Record<string, unknown>[]} />

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveKPIs.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {/* Strategic Insights */}
      <StrategicInsightsPanel insights={insights} />

      {/* Category Price Heatmap */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Price Heatmap</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Category × Platform Price Gap</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[160px]">Category</th>
                      {PLATFORMS.map((p) => <th key={p} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[110px]">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row) => {
                      const cellMap = Object.fromEntries(row.platforms.map((p) => [p.name, p]));
                      return (
                        <tr key={row.category} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{row.category}</td>
                          {PLATFORMS.map((p) => {
                            const cell = cellMap[p];
                            const gap = cell?.priceGap ?? 0;
                            const color = heatmapCellColor(gap);
                            const label = heatmapLabel(gap);
                            return (
                              <td key={p} className="p-2 text-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`rounded-md px-2 py-1.5 text-xs font-semibold cursor-default border ${color}/20 text-${color.replace("bg-", "")} border-${color.replace("bg-", "")}/30`}>
                                        {gap >= 0 ? "+" : ""}{gap.toFixed(1)}%
                                        <div className="text-[10px] opacity-70 mt-0.5">{label}</div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{label} — gap: {gap >= 0 ? "+" : ""}{gap.toFixed(1)}%</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Platform Competitiveness Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Competitiveness Summary</h2>
        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Platform Competitiveness Score</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformCompData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(value: number, _name: string, props: { dataKey: string; payload: { platform: string } }) => {
                    const idx = platformCompData.findIndex(d => d.platform === props.payload.platform);
                    const color = CHART_COLORS[idx % CHART_COLORS.length];
                    return [<span style={{ color }}>{value}/100</span>, <span style={{ color }}>Score</span>];
                  }}
                />
                <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                  {platformCompData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Top Price Gap Items */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Price Gap Items</h2>
        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Top 10 SKUs by Price Gap</CardTitle></CardHeader>
          <CardContent>
            {topPriceGapSKUs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No price gap data for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["#", "Product", "Category", "Platform", "Platform Price", "Avg Price", "Gap %", "Risk"].map((h) => (
                        <th key={h} className="py-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topPriceGapSKUs.map((row, i) => {
                      const risk = getRiskLevel(row.gapPct);
                      return (
                        <tr key={`${row.sku_id}-${row.platform}`} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-2 pr-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="py-2 pr-3 font-medium max-w-[220px]">
                             <div className="flex items-center gap-1.5 flex-wrap">
                               <span className="truncate">{row.product_name}</span>
                               {skuRegionalMap[row.sku_id] && (
                                 <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                                   Regional
                                 </span>
                               )}
                             </div>
                           </td>
                          <td className="py-2 pr-3 text-muted-foreground text-xs">{row.category}</td>
                          <td className="py-2 pr-3 text-xs">{row.platform}</td>
                          <td className="py-2 pr-3 text-xs font-mono">₹{row.platformPrice.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-xs font-mono text-muted-foreground">₹{row.competitorAvg.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-xs font-semibold text-status-high">+{row.gapPct.toFixed(1)}%</td>
                          <td className="py-2">
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium", getRiskColor(risk))}>{risk}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Category Price Pressure vs Market */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Price Pressure vs Market</h2>
        <Card className="bg-gradient-card">
          <CardHeader><CardTitle>Zepto vs Competitor Average Price by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryPricePressure.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryPricePressure} margin={{ top: 8, right: 24, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-40} textAnchor="end" interval={0} height={70} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <RechartsTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, name: string) => [`₹${v.toFixed(2)}`, name]}
                  />
                  <Bar dataKey="zepto_avg_price" name="Zepto Avg Price" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="competitor_avg_price" name="Competitor Avg Price" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
 
export default CompetitiveOverview;
