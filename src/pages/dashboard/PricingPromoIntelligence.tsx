import { KPICard } from "@/components/dashboard/KPICard";
import { getDiscountByPlatform, getPriceData, GlobalFilters } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";
import { SKUCrossPlatformComparison } from "@/components/dashboard/SKUCrossPlatformComparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";

const promoRows = [
  { platform: "Blinkit", category: "Snacks & Beverages", type: "Flash Sale", discount: "40%", city: "Bangalore", status: "Active" as const },
  { platform: "Zepto", category: "Dairy & Eggs", type: "Combo Offer", discount: "15%", city: "Mumbai", status: "Active" as const },
  { platform: "Swiggy Instamart", category: "Personal Care", type: "Buy 2 Get 1", discount: "33%", city: "Delhi NCR", status: "Active" as const },
  { platform: "BigBasket Now", category: "Staples & Grains", type: "Weekend Deal", discount: "10%", city: "All", status: "Active" as const },
  { platform: "Zepto", category: "Fruits & Vegetables", type: "Loyalty Discount", discount: "12%", city: "Hyderabad", status: "Ending Soon" as const },
];

const PLATFORM_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const PricingPromoIntelligence = () => {
  const filters = useOutletContext<GlobalFilters>();

  const priceData = getPriceData(filters);
  const discountByPlatform = getDiscountByPlatform(filters);

  const avgDiscount =
    priceData.length > 0
      ? priceData.reduce((s, r) => s + r.discount_percent, 0) / priceData.length
      : 0;

  const promoCount = priceData.filter((r) => r.promotion_flag === 1).length;

  // ── Promotion Activity by Platform ────────────────────────────────────────
  const promoByPlatformRaw: Record<string, { sum: number; count: number }> = {};
  priceData.forEach((row) => {
    if (!promoByPlatformRaw[row.platform]) promoByPlatformRaw[row.platform] = { sum: 0, count: 0 };
    promoByPlatformRaw[row.platform].sum += row.promotion_flag;
    promoByPlatformRaw[row.platform].count += 1;
  });
  const promoActivityData = Object.entries(promoByPlatformRaw)
    .map(([platform, { sum, count }]) => ({
      platform,
      "Promotion Rate %": parseFloat(((sum / count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b["Promotion Rate %"] - a["Promotion Rate %"]);

  const kpis = [
    {
      title: "Average Discount",
      value: `${avgDiscount.toFixed(1)}%`,
      trend: "neutral" as const,
      tooltip: "Mean discount percentage across all SKUs with active promotions.",
    },
    {
      title: "SKUs Under Promotion",
      value: promoCount.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Number of price observations with promotion_flag = 1",
    },
    {
      title: "Price Observations",
      value: priceData.length.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Total rows in the filtered price tracking dataset",
    },
  ];

  // ── Heatmap computation ────────────────────────────────────────────────────
  const heatmapRaw: Record<string, Record<string, number[]>> = {};
  priceData.forEach((row) => {
    const gap = row.mrp > 0 ? ((row.sale_price - row.mrp) / row.mrp) * 100 : 0;
    if (!heatmapRaw[row.category]) heatmapRaw[row.category] = {};
    if (!heatmapRaw[row.category][row.platform]) heatmapRaw[row.category][row.platform] = [];
    heatmapRaw[row.category][row.platform].push(gap);
  });

  const categoryAvgGap: Record<string, number> = {};
  Object.entries(heatmapRaw).forEach(([category, platforms]) => {
    const allGaps = Object.values(platforms).flat();
    categoryAvgGap[category] = allGaps.length > 0 ? allGaps.reduce((a, b) => a + b, 0) / allGaps.length : 0;
  });

  const heatmap = Object.entries(heatmapRaw).map(([category, platforms]) => ({
    category,
    platforms: Object.entries(platforms).map(([platform, gaps]) => {
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const normalizedGap = avgGap - (categoryAvgGap[category] ?? 0);
      return { platform, avgGap, normalizedGap };
    }),
  }));

  const allPlatforms = Array.from(new Set(heatmap.flatMap((row) => row.platforms.map((p) => p.platform)))).sort();

  const getCellStyle = (normalizedGap: number) => {
    if (normalizedGap <= -0.8) return "bg-status-low/20 text-status-low border border-status-low/30";
    if (normalizedGap <= 0.8)  return "bg-status-medium/20 text-status-medium border border-status-medium/30";
    return "bg-status-critical/20 text-status-critical border border-status-critical/30";
  };

  const getCellLabel = (normalizedGap: number) => {
    if (normalizedGap <= -0.8) return "Competitive";
    if (normalizedGap <= 0.8)  return "Neutral";
    return "Overpriced";
  };

  const barColor = (discount: number) =>
    discount >= 20 ? "bg-status-high" : discount >= 10 ? "bg-status-medium" : "bg-status-low";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Tag className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Pricing & Promotion Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Monitor price movements, discounts, and promotional strategies across platforms
          </p>
        </div>
      </div>

      <PageControlBar exportLabel="price_tracking" exportData={priceData as unknown as Record<string, unknown>[]} />

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {/* Strategic Insights */}
      {(() => {
        const topPromo = promoActivityData[0];
        const catDiscountRaw: Record<string, { sum: number; count: number }> = {};
        priceData.forEach((row) => {
          if (!catDiscountRaw[row.category]) catDiscountRaw[row.category] = { sum: 0, count: 0 };
          catDiscountRaw[row.category].sum += row.discount_percent;
          catDiscountRaw[row.category].count++;
        });
        const topCatDiscount = Object.entries(catDiscountRaw)
          .map(([cat, { sum, count }]) => ({ cat, avg: sum / count }))
          .sort((a, b) => b.avg - a.avg)[0];
        const topDiscount = [...discountByPlatform].sort((a, b) => b.avgDiscount - a.avgDiscount)[0];

        const insights: Insight[] = [
          topPromo
            ? { icon: "zap", title: "Promotion Intensity", body: `${topPromo.platform} is currently running the most aggressive promotions, with ${topPromo["Promotion Rate %"]}% of tracked SKUs under active promotion.`, type: "warning" }
            : { icon: "zap", title: "Promotion Intensity", body: "No promotion data available for the selected filters.", type: "neutral" },
          topCatDiscount
            ? { icon: "tag", title: "Category Price Gap", body: `${topCatDiscount.cat} shows the highest average discount at ${topCatDiscount.avg.toFixed(1)}%, signalling strong promotional pressure in this category.`, type: "warning" }
            : { icon: "tag", title: "Category Price Gap", body: "No category discount data available.", type: "neutral" },
          topDiscount
            ? { icon: "trend-down", title: "Discount Depth", body: `${topDiscount.platform} offers the deepest average discount at ${topDiscount.avgDiscount.toFixed(1)}%, indicating the most aggressive pricing strategy across platforms.`, type: "critical" }
            : { icon: "trend-down", title: "Discount Depth", body: "No discount data available.", type: "neutral" },
        ];
        return <StrategicInsightsPanel insights={insights} />;
      })()}

      {/* Category Price Competitiveness Heatmap */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Price Competitiveness</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Category Price Competitiveness Heatmap</CardTitle>
                <CardDescription>Average price gap vs MRP by category and platform</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-status-low/40 border border-status-low/30 inline-block" />Competitive (≤ −5%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-status-medium/40 border border-status-medium/30 inline-block" />Neutral (±5%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-status-critical/40 border border-status-critical/30 inline-block" />Overpriced (&gt; +5%)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {heatmap.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[160px]">Category</th>
                      {allPlatforms.map((platform) => (
                        <th key={platform} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[110px]">{platform}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.map((row) => {
                      const cellMap = Object.fromEntries(row.platforms.map((p) => [p.platform, p]));
                      return (
                        <tr key={row.category} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{row.category}</td>
                          {allPlatforms.map((platform) => {
                            const cell = cellMap[platform];
                            if (!cell) return (
                              <td key={platform} className="p-2 text-center">
                                <div className="rounded-md px-2 py-2 text-xs text-muted-foreground bg-muted/30 border border-border/30">—</div>
                              </td>
                            );
                            const { normalizedGap } = cell;
                            return (
                              <td key={platform} className="p-2 text-center">
                                <div className={`rounded-md px-2 py-2 text-xs font-semibold transition-all hover:scale-105 cursor-default ${getCellStyle(normalizedGap)}`}
                                  title={`${getCellLabel(normalizedGap)} — normalized gap: ${normalizedGap > 0 ? "+" : ""}${normalizedGap.toFixed(1)}%`}>
                                  <div className="font-bold">{normalizedGap > 0 ? "+" : ""}{normalizedGap.toFixed(1)}%</div>
                                  <div className="text-[10px] opacity-75 mt-0.5">{getCellLabel(normalizedGap)}</div>
                                </div>
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

      {/* Promotion Activity by Platform */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Promotion Activity by Platform</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Promotion Activity by Platform</CardTitle>
            <CardDescription>Share of SKU observations with an active promotion flag, per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {promoActivityData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={promoActivityData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 25]} />
                   <Tooltip
                     contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                     labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                      formatter={(v: number, _name: string, props: { payload: { platform: string } }) => {
                        const idx = promoActivityData.findIndex(d => d.platform === props.payload.platform);
                        const color = PLATFORM_COLORS[idx % PLATFORM_COLORS.length];
                        return [<span style={{ color }}>{v}%</span>, <span style={{ color }}>Promotion Rate</span>];
                      }}
                     cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                   />
                  <Bar dataKey="Promotion Rate %" radius={[4, 4, 0, 0]}>
                    {promoActivityData.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Platform Discount Comparison + Active Promotions */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Discount Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Platform Average Discount</CardTitle>
              <CardDescription>Mean discount % per platform from price tracking data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discountByPlatform.map((p) => (
                  <div key={p.platform} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{p.platform}</span>
                      <span className="text-muted-foreground">{p.avgDiscount}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(p.avgDiscount)}`} style={{ width: `${Math.min(p.avgDiscount * 2.5, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Active Promotions Tracker</CardTitle>
              <CardDescription>Current promotional campaigns across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Platform</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Category</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Disc.</th>
                      <th className="py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.platform}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{row.category}</td>
                        <td className="py-2 pr-3 text-xs">{row.type}</td>
                        <td className="py-2 pr-3 text-xs font-semibold text-status-high">{row.discount}</td>
                        <td className="py-2">
                          <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-xs">{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SKUCrossPlatformComparison filters={filters} />
    </div>
  );
};

export default PricingPromoIntelligence;
