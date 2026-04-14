import { KPICard } from "@/components/dashboard/KPICard";
import { GlobalFilters, datasets } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { SKUCrossPlatformComparison } from "@/components/dashboard/SKUCrossPlatformComparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";
import { CityPincodeTreeTable } from "@/components/dashboard/CityPincodeTreeTable";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

/** Population stddev of values */
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

const LocalMarketIntelligence = () => {
  const { city, platform, pincode, category, dateFrom, dateTo } = useOutletContext<GlobalFilters>();

  const cityScores = useMemo(() =>
    CITIES.map((c) => {
      // ── Filter each dataset strictly by this city only (no global city filter) ──
      const priceRows = datasets.priceTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      const availRows = datasets.availabilityTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      const searchRows = datasets.searchRankTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      // ── Simple direct averages per city (preserves natural variance) ──────
      const promoRate   = avg(priceRows.map((r) => r.promotion_flag * 100));
      const discount    = avg(priceRows.map((r) => r.discount_percent));
      const availability = avg(availRows.map((r) => r.availability_flag * 100));
      const search      = avg(searchRows.map((r) => (r.top10_flag ?? (r.search_rank <= 10 ? 1 : 0)) * 100));

      // ── Hyperlocal price variance: stddev of avg sale price per (sku × platform) ──
      // Groups all city rows by SKU-platform pairs (each a unique "local market point"),
      // computes avg sale_price per group, then takes population stddev of those averages.
      // Falls back to per-pincode grouping when pincode data is present.
      const priceBuckets: Record<string, number[]> = {};
      for (const row of priceRows) {
        // Use pincode if available, otherwise sku_id × platform as a geographic proxy
        const key = row.pincode
          ? String(row.pincode)
          : `${row.sku_id}||${row.platform}`;
        if (!priceBuckets[key]) priceBuckets[key] = [];
        priceBuckets[key].push(row.sale_price);
      }
      const bucketAvgs = Object.values(priceBuckets).map((vals) => avg(vals));
      const priceVariance = parseFloat(stddev(bucketAvgs).toFixed(2));

      // ── Market Competition Index (weighted, all inputs 0–100) ─────────────
      // Keep full precision (1 decimal) so cities with similar but non-identical
      // data still show distinguishable scores.
      const score = parseFloat(
        (0.35 * promoRate + 0.25 * discount + 0.20 * search + 0.20 * availability).toFixed(1)
      );

      return { city: c, availability, discount, promoRate, search, priceVariance, score };
    }),
  // Intentionally excludes `city` — each city is computed independently from full data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [platform, dateFrom, dateTo]);

  const sortedByScore = [...cityScores].sort((a, b) => b.score - a.score);
  const bestCity = sortedByScore[0];
  const worstCity = sortedByScore[sortedByScore.length - 1];
  const avgScore = avg(cityScores.map((c) => c.score));
  const highestVarianceCity = [...cityScores].sort((a, b) => b.priceVariance - a.priceVariance)[0];

  const kpis = [
    { title: "Market Competition Index", value: avgScore.toFixed(1), trend: "neutral" as const, tooltip: "Market Competition Index: Weighted score (0–100) = 35% Promotion Share + 25% Avg Discount Depth + 20% Top-10 Presence + 20% SKU Availability Rate." },
    { title: "Best Performing City", value: bestCity?.city ?? "—", change: bestCity?.score, changeType: "absolute" as const, trend: "up" as const, tooltip: "City with the highest Market Competition Index score." },
    { title: "Lowest Performing City", value: worstCity?.city ?? "—", change: worstCity?.score, changeType: "absolute" as const, trend: "down" as const, tooltip: "City with the lowest Market Competition Index score." },
    { title: "Hyperlocal Price Variance", value: highestVarianceCity ? `₹${highestVarianceCity.priceVariance}` : "—", trend: highestVarianceCity?.priceVariance > 4 ? "down" as const : "neutral" as const, tooltip: `Hyperlocal Price Variance: Std-dev of avg sale prices across SKU-platform groups within a city. Higher values indicate inconsistent local pricing — ${highestVarianceCity?.city ?? "—"} leads.` },
  ];

  const cityChartData = cityScores.map((c) => ({
    city: c.city,
    "Market Competition Index": c.score,
    "SKU Availability Rate": parseFloat(c.availability.toFixed(1)),
    "Top-10 Presence": parseFloat(c.search.toFixed(1)),
    "Price Competitiveness": parseFloat((100 - c.discount).toFixed(1)),
  }));

  // ── Strategic Insights ───────────────────────────────────────────────────────
  const topCity = sortedByScore[0];
  
  const lowestAvailCity = [...cityScores].sort((a, b) => a.availability - b.availability)[0];
  const highPromoCity = [...cityScores].sort((a, b) => b.promoRate - a.promoRate)[0];

  const insights: Insight[] = [
    topCity
      ? { icon: "pin", title: "Most Competitive City", body: `${topCity.city} leads with a Market Competition Index of ${topCity.score}/100 — driven by promo intensity (${topCity.promoRate.toFixed(1)}%), avg discount (${topCity.discount.toFixed(1)}%), and ${topCity.availability.toFixed(0)}% SKU availability.`, type: "positive" }
      : { icon: "pin", title: "Most Competitive City", body: "No city data available.", type: "neutral" },
    highestVarianceCity
      ? { icon: "tag", title: "Hyperlocal Price Hotspot", body: `${highestVarianceCity.city} shows the highest price dispersion (₹${highestVarianceCity.priceVariance} std-dev across SKU-platform groups), indicating uneven local pricing that may signal differential trade terms.`, type: highestVarianceCity.priceVariance > 5 ? "warning" : "neutral" }
      : { icon: "tag", title: "Hyperlocal Price Hotspot", body: "No variance data available.", type: "neutral" },
    lowestAvailCity
      ? { icon: "trend-down", title: "Regional Availability Gap", body: `${lowestAvailCity.city} has the lowest SKU Availability Rate at ${lowestAvailCity.availability.toFixed(1)}%, suggesting elevated stockout risk vs the ${avgScore.toFixed(1)} avg across all cities.`, type: lowestAvailCity.availability < 80 ? "critical" : "warning" }
      : { icon: "trend-down", title: "Regional Availability Gap", body: "No availability data available.", type: "neutral" },
    highPromoCity
      ? { icon: "tag", title: "Highest Promo Intensity", body: `${highPromoCity.city} has the most promotional activity at ${highPromoCity.promoRate.toFixed(1)}% promo rate — monitor for margin pressure.`, type: "warning" }
      : { icon: "tag", title: "Highest Promo Intensity", body: "No promo data.", type: "neutral" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Local Market Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            City-level deep dives: Bangalore · Mumbai · Delhi NCR · Pune · Hyderabad
          </p>
        </div>
      </div>

      <PageControlBar exportLabel="local_market_intelligence" exportData={cityScores as unknown as Record<string, unknown>[]} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      <StrategicInsightsPanel insights={insights} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">City Market Competition Index</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>City Market Competition Index</CardTitle>
            <CardDescription>Market Competition Index, SKU Availability Rate, Top-10 Presence, and Price Competitiveness per city (two-stage aggregation)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Market Competition Index" fill="hsl(var(--status-low))"    radius={[4, 4, 0, 0]} />
                <Bar dataKey="SKU Availability Rate"   fill="hsl(221 83% 53%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Top-10 Presence"         fill="hsl(270 70% 55%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price Competitiveness"   fill="hsl(var(--status-medium))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hyperlocal Price Variance by City</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Hyperlocal Price Variance</CardTitle>
            <CardDescription>Std-dev of avg sale price across pincodes — highlights cities with inconsistent pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...cityScores].sort((a, b) => b.priceVariance - a.priceVariance).map((c) => {
                const maxVariance = Math.max(...cityScores.map((x) => x.priceVariance), 1);
                const pct = Math.round((c.priceVariance / maxVariance) * 100);
                const color = c.priceVariance > 5 ? "bg-status-high" : c.priceVariance > 3 ? "bg-status-medium" : "bg-status-low";
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.city}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">₹{c.priceVariance}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">City × Pincode Breakdown</h2>
        <CityPincodeTreeTable filters={{ platform, dateFrom, dateTo, category }} />
      </section>

      <SKUCrossPlatformComparison filters={{ city, pincode, category, dateFrom, dateTo }} mode="hyperlocal" />
    </div>
  );
};

export default LocalMarketIntelligence;
