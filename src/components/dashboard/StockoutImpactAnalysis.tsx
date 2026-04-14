// @ts-nocheck
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Tag } from "lucide-react";
import { datasets } from "@/data/dataLoader";
import type { GlobalFilters, AvailabilityRecord } from "@/data/dataLoader";
import { applyFilters } from "@/data/dataLoader";

interface Props {
  filters: GlobalFilters;
}

function impactColor(index: number) {
  if (index >= 0.3) return "text-status-critical";
  if (index >= 0.2) return "text-status-high";
  return "text-status-medium";
}

function impactBg(index: number) {
  if (index >= 0.3) return "bg-status-critical/10 text-status-critical border-status-critical/20";
  if (index >= 0.2) return "bg-status-high/10 text-status-high border-status-high/20";
  return "bg-status-medium/10 text-status-medium border-status-medium/20";
}

function stockoutRateColor(rate: number) {
  if (rate >= 0.25) return "bg-status-critical";
  if (rate >= 0.15) return "bg-status-high";
  return "bg-status-medium";
}

export function StockoutImpactAnalysis({ filters }: Props) {
  const data = useMemo(
    () => applyFilters<AvailabilityRecord>(datasets.availabilityTracking, filters),
    [filters]
  );

  // ── 1. Critical Stockout Index ────────────────────────────────────────────
  const criticalIndex = useMemo(() => {
    const byPlatform: Record<string, { total: number; critical: number }> = {};
    for (const row of data) {
      if (row.availability_flag !== 0) continue;
      if (!byPlatform[row.platform]) byPlatform[row.platform] = { total: 0, critical: 0 };
      byPlatform[row.platform].total++;
      if (row.must_have_flag === 1) byPlatform[row.platform].critical++;
    }
    return Object.entries(byPlatform)
      .map(([platform, { total, critical }]) => ({
        platform,
        total,
        critical,
        impact_index: total > 0 ? critical / total : 0,
      }))
      .sort((a, b) => b.impact_index - a.impact_index);
  }, [data]);

  // ── 2. City Stockout Hotspots ──────────────────────────────────────────────
  const cityHotspots = useMemo(() => {
    const byKey: Record<string, { stockout: number; total: number }> = {};
    for (const row of data) {
      const key = `${row.city}__${row.platform}`;
      if (!byKey[key]) byKey[key] = { stockout: 0, total: 0 };
      byKey[key].total++;
      if (row.availability_flag === 0) byKey[key].stockout++;
    }
    return Object.entries(byKey)
      .map(([key, { stockout, total }]) => {
        const [city, platform] = key.split("__");
        return { city, platform, stockout_rate: total > 0 ? stockout / total : 0, total };
      })
      .filter((r) => r.stockout_rate > 0)
      .sort((a, b) => b.stockout_rate - a.stockout_rate)
      .slice(0, 8);
  }, [data]);

  // ── 3. Category Critical Stockouts ───────────────────────────────────────
  const categoryStockouts = useMemo(() => {
    const byCat: Record<string, { mustHaveStockout: number; mustHaveTotal: number }> = {};
    for (const row of data) {
      if (row.must_have_flag !== 1) continue;
      if (!byCat[row.category]) byCat[row.category] = { mustHaveStockout: 0, mustHaveTotal: 0 };
      byCat[row.category].mustHaveTotal++;
      if (row.availability_flag === 0) byCat[row.category].mustHaveStockout++;
    }
    return Object.entries(byCat)
      .map(([category, { mustHaveStockout, mustHaveTotal }]) => ({
        category,
        critical_stockouts: mustHaveStockout,
        must_have_stockout_rate: mustHaveTotal > 0 ? mustHaveStockout / mustHaveTotal : 0,
      }))
      .filter((r) => r.must_have_stockout_rate > 0)
      .sort((a, b) => b.must_have_stockout_rate - a.must_have_stockout_rate);
  }, [data]);

  const hasData = data.length > 0;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Stockout Impact Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Critical Stockout Index ── */}
        <Card className="bg-gradient-card lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-critical" />
              <CardTitle className="text-base">Critical Stockout Index</CardTitle>
            </div>
            <CardDescription>Must-have SKU stockout share per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData || criticalIndex.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No stockout data for selected filters.</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                  <span className="col-span-1">Platform</span>
                  <span className="text-center">Total</span>
                  <span className="text-center">Critical</span>
                  <span className="text-right">Index</span>
                </div>
                {criticalIndex.map((row) => (
                  <div
                    key={row.platform}
                    className="grid grid-cols-4 text-xs py-2 border-b border-border/40 last:border-0 items-center"
                  >
                    <span className="font-medium truncate col-span-1 pr-1">{row.platform}</span>
                    <span className="text-center text-muted-foreground">{row.total}</span>
                    <span className="text-center text-muted-foreground">{row.critical}</span>
                    <span className={`text-right font-semibold ${impactColor(row.impact_index)}`}>
                      {(row.impact_index * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── City Stockout Hotspots ── */}
        <Card className="bg-gradient-card lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-status-high" />
              <CardTitle className="text-base">City Stockout Hotspots</CardTitle>
            </div>
            <CardDescription>Highest stockout rate by city + platform</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData || cityHotspots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No city stockout data for selected filters.</p>
            ) : (
              <div className="space-y-2">
                {cityHotspots.map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium">{row.city}</span>
                        <span className="text-muted-foreground ml-1">· {row.platform}</span>
                      </div>
                      <span className={`font-semibold ${impactColor(row.stockout_rate)}`}>
                        {(row.stockout_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stockoutRateColor(row.stockout_rate)}`}
                        style={{ width: `${(row.stockout_rate * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Category Critical Stockouts ── */}
        <Card className="bg-gradient-card lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-status-medium" />
              <CardTitle className="text-base">Category Critical Stockouts</CardTitle>
            </div>
            <CardDescription>Must-have SKU stockout rate per category</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData || categoryStockouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No category critical stockout data for selected filters.</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                  <span className="col-span-1">Category</span>
                  <span className="text-center">Critical SKUs</span>
                  <span className="text-right">Stockout Rate</span>
                </div>
                {categoryStockouts.map((row) => (
                  <div
                    key={row.category}
                    className="grid grid-cols-3 text-xs py-2 border-b border-border/40 last:border-0 items-center"
                  >
                    <span className="font-medium truncate col-span-1 pr-1">{row.category}</span>
                    <span className="text-center text-muted-foreground">{row.critical_stockouts}</span>
                    <div className="flex justify-end">
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0 h-5 border ${impactBg(row.must_have_stockout_rate)}`}
                      >
                        {(row.must_have_stockout_rate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
