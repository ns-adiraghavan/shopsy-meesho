// @ts-nocheck
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

interface Props {
  filters: Partial<GlobalFilters>;
  /** When "hyperlocal", the SKU comparison table groups by pincode with platform columns */
  mode?: "default" | "hyperlocal";
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

/** Resolve product name from skuMaster; fall back to "Unknown Product" */
function resolveProductName(s: { product_name?: string } | null | undefined): string {
  return s?.product_name || "Unknown Product";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AvailBadge({ flag }: { flag: number }) {
  if (flag >= 0.8)
    return (
      <Badge className="bg-status-low/20 text-status-low border border-status-low/30 text-xs">
        In Stock
      </Badge>
    );
  if (flag >= 0.4)
    return (
      <Badge className="bg-status-medium/20 text-status-medium border border-status-medium/30 text-xs">
        Low Stock
      </Badge>
    );
  return (
    <Badge className="bg-status-critical/20 text-status-critical border border-status-critical/30 text-xs">
      Out of Stock
    </Badge>
  );
}

function PromoBadge({ flag }: { flag: number }) {
  return flag >= 0.5 ? (
    <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">
      Yes
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">No</span>
  );
}

function discountColor(pct: number) {
  if (pct >= 20) return "text-status-critical font-semibold";
  if (pct >= 10) return "text-status-medium font-medium";
  return "text-muted-foreground";
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SKUCrossPlatformComparison({ filters, mode = "default" }: Props) {
  const categories = useMemo(
    () =>
      Array.from(new Set(datasets.skuMaster.map((s) => s.category))).sort(),
    []
  );

  const globalCategory =
    filters.category && filters.category !== "All Categories"
      ? filters.category
      : null;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    globalCategory ?? ""
  );
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSkuId("");
  };

  const productsInCategory = useMemo(
    () =>
      datasets.skuMaster
        .filter((s) => s.category === selectedCategory)
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.sku_id.localeCompare(b.sku_id)),
    [selectedCategory]
  );

  const categoryProductCount = productsInCategory.length;

  const selectedSku = useMemo(
    () =>
      selectedSkuId
        ? (datasets.skuMaster.find((s) => s.sku_id === selectedSkuId) ?? null)
        : null,
    [selectedSkuId]
  );

  // ── Platform comparison rows ──────────────────────────────────────────────
  const comparisonRows = useMemo(() => {
    if (!selectedSkuId) return [];

    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      pincode: filters.pincode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const priceBase = applyFilters(datasets.priceTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );
    const availBase = applyFilters(datasets.availabilityTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );

    return PLATFORMS.map((platform) => {
      const priceRows = priceBase.filter((r) => r.platform === platform);
      const availRows = availBase.filter((r) => r.platform === platform);

      if (priceRows.length === 0 && availRows.length === 0) {
        return { platform, listed: false as const };
      }

      const salePrice = avg(priceRows.map((r) => r.sale_price));
      const discountPct = avg(priceRows.map((r) => r.discount_percent));
      const promoFlag = avg(priceRows.map((r) => r.promotion_flag));
      const availFlag = avg(availRows.map((r) => r.availability_flag));

      const promoTypeMap: Record<string, number> = {};
      priceRows
        .map((r) => r.promotion_type)
        .filter(Boolean)
        .forEach((t) => {
          promoTypeMap[t!] = (promoTypeMap[t!] ?? 0) + 1;
        });
      const promoType =
        Object.entries(promoTypeMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

      return {
        platform,
        listed: true as const,
        salePrice,
        discountPct,
        promoFlag,
        promoType,
        availFlag,
      };
    });
  }, [selectedSkuId, filters]);

  // ── Hyperlocal price context rows (default mode) ──────────────────────────
  type HyperlocalRow = {
    city: string;
    pincode: string;
    platform: string;
    avgPrice: number;
  };

  const hyperlocalRows = useMemo((): HyperlocalRow[] => {
    if (!selectedSkuId) return [];

    const dateFilters: Partial<GlobalFilters> = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const rows = applyFilters(datasets.priceTracking, dateFilters).filter(
      (r) => r.sku_id === selectedSkuId && r.pincode && r.city
    );

    const grouped: Record<string, { sum: number; count: number }> = {};
    for (const r of rows) {
      const key = `${r.city}||${r.pincode}||${r.platform}`;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += r.sale_price;
      grouped[key].count += 1;
    }

    return Object.entries(grouped)
      .map(([key, { sum, count }]) => {
        const [city, pincode, platform] = key.split("||");
        return { city, pincode, platform, avgPrice: sum / count };
      })
      .sort((a, b) => a.city.localeCompare(b.city) || a.pincode.localeCompare(b.pincode));
  }, [selectedSkuId, filters]);

  // ── Hyperlocal pincode competition rows (hyperlocal mode) ─────────────────
  type PincodePriceRow = {
    city: string;
    pincode: string;
    platformPrices: Record<string, number | null>;
    avgPrice: number;
    cityAvgDelta: number;
    signal: "Undercutting Market" | "Premium Locality" | "In Line";
  };

  const pincodePriceRows = useMemo((): PincodePriceRow[] => {
    if (!selectedSkuId || mode !== "hyperlocal") return [];

    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const allSkuRows = applyFilters(datasets.priceTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );

    if (allSkuRows.length === 0) return [];

    // Pincodes are normalized to strings at load time in DataContext
    const priceBase = allSkuRows.filter((r) => r.pincode && r.city);

    // If no pincode data exists, fall back to city-level grouping
    if (priceBase.length === 0) {
      const cityAvg = avg(allSkuRows.map((r) => r.sale_price));
      const cities = [...new Set(allSkuRows.map((r) => r.city))];
      return cities
        .map((city) => {
          const cityRows = allSkuRows.filter((r) => r.city === city);
          const platformPrices: Record<string, number | null> = {};
          for (const platform of PLATFORMS) {
            const pRows = cityRows.filter((r) => r.platform === platform);
            platformPrices[platform] = pRows.length > 0 ? avg(pRows.map((r) => r.sale_price)) : null;
          }
          const validPrices = Object.values(platformPrices).filter((v): v is number => v !== null);
          const avgPrice = avg(validPrices);
          const delta = cityAvg > 0 ? ((avgPrice - cityAvg) / cityAvg) * 100 : 0;
          const signal: PincodePriceRow["signal"] =
            delta <= -3 ? "Undercutting Market" : delta >= 3 ? "Premium Locality" : "In Line";
          return { city, pincode: "—", platformPrices, avgPrice, cityAvgDelta: delta, signal };
        })
        .sort((a, b) => a.city.localeCompare(b.city) || a.avgPrice - b.avgPrice);
    }

    // Group by city+pincode, compute per-city average for delta
    const cityGroups = [...new Set(priceBase.map((r) => r.city))];
    const rows: PincodePriceRow[] = [];

    for (const city of cityGroups) {
      const cityRows = priceBase.filter((r) => r.city === city);
      const cityAvg = avg(cityRows.map((r) => r.sale_price));
      const pincodes = [...new Set(cityRows.map((r) => r.pincode))];

      for (const pincode of pincodes) {
        const pinRows = cityRows.filter((r) => r.pincode === pincode);

        const platformPrices: Record<string, number | null> = {};
        for (const platform of PLATFORMS) {
          const pRows = pinRows.filter((r) => r.platform === platform);
          platformPrices[platform] = pRows.length > 0 ? avg(pRows.map((r) => r.sale_price)) : null;
        }

        const validPrices = Object.values(platformPrices).filter((v): v is number => v !== null);
        const avgPrice = avg(validPrices);
        const delta = cityAvg > 0 ? ((avgPrice - cityAvg) / cityAvg) * 100 : 0;

        const signal: PincodePriceRow["signal"] =
          delta <= -3 ? "Undercutting Market" : delta >= 3 ? "Premium Locality" : "In Line";

        rows.push({ city, pincode: pincode!, platformPrices, avgPrice, cityAvgDelta: delta, signal });
      }
    }

    return rows.sort((a, b) => a.city.localeCompare(b.city) || a.avgPrice - b.avgPrice);
  }, [selectedSkuId, filters, mode]);

  // ── Promotion Benchmark rows ──────────────────────────────────────────────
  const promotionBenchmarkRows = useMemo(() => {
    if (!selectedSkuId || !selectedCategory) return [];

    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      pincode: filters.pincode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const allFiltered = applyFilters(datasets.priceTracking, baseFilters).filter(
      (r) => r.category === selectedCategory
    );
    const skuFiltered = allFiltered.filter((r) => r.sku_id === selectedSkuId);

    return PLATFORMS.map((platform) => {
      const catRows = allFiltered.filter((r) => r.platform === platform);
      const skuRows = skuFiltered.filter((r) => r.platform === platform);

      if (catRows.length === 0 && skuRows.length === 0) return null;

      const catPromoRate = avg(catRows.map((r) => r.promotion_flag)) * 100;
      const catAvgDiscount = avg(catRows.map((r) => r.discount_percent));
      const skuPromoRate = avg(skuRows.map((r) => r.promotion_flag)) * 100;
      const skuDiscount = avg(skuRows.map((r) => r.discount_percent));

      const hasSkuData = skuRows.length > 0;
      const indicator: "above" | "below" | "equal" | "no-data" = !hasSkuData
        ? "no-data"
        : skuPromoRate > catPromoRate + 2
        ? "above"
        : skuPromoRate < catPromoRate - 2
        ? "below"
        : "equal";

      return { platform, catPromoRate, catAvgDiscount, skuPromoRate, skuDiscount, indicator, hasSkuData };
    }).filter(Boolean) as {
      platform: string;
      catPromoRate: number;
      catAvgDiscount: number;
      skuPromoRate: number;
      skuDiscount: number;
      indicator: "above" | "below" | "equal" | "no-data";
      hasSkuData: boolean;
    }[];
  }, [selectedSkuId, selectedCategory, filters]);


  const hasActiveFilters =
    (filters.city && filters.city !== "All Cities") ||
    (filters.pincode && filters.pincode !== "All Pincodes");

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {mode === "hyperlocal" ? "Hyperlocal Price Competition" : "Cross-Platform Product Comparison"}
      </h2>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            {mode === "hyperlocal" ? (
              <MapPin className="h-4 w-4 text-primary" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            )}
            <div>
              <CardTitle>
                {mode === "hyperlocal" ? "Hyperlocal Price Competition" : "Cross-Platform Product Comparison"}
              </CardTitle>
              <CardDescription>
                {mode === "hyperlocal"
                  ? "Compare how the selected product is priced across pincodes within the city and identify localities where competitors are undercutting the market."
                  : "Select a category and product to compare price, discount, promotions, and availability across all platforms — filtered by active city, pincode, and date selection"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Selectors row ── */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Category */}
            <div className="space-y-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product */}
            <div className="space-y-1 min-w-[240px] flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Product
              </label>
              <Select
                value={selectedSkuId}
                onValueChange={setSelectedSkuId}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue
                    placeholder={
                      selectedCategory ? "Select product…" : "Select a category first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {productsInCategory.map((s) => (
                    <SelectItem key={s.sku_id} value={s.sku_id}>
                      {resolveProductName(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category context badge */}
            {selectedCategory && (
              <div className="pb-0.5">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  {selectedCategory} · {categoryProductCount} product
                  {categoryProductCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* ── Active geo-filter context ── */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground items-center">
              <span className="font-medium">Filters active:</span>
              {filters.city && filters.city !== "All Cities" && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filters.city}
                </Badge>
              )}
              {filters.pincode && filters.pincode !== "All Pincodes" && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filters.pincode}
                </Badge>
              )}
            </div>
          )}

          {/* ── Selected product header ── */}
          {selectedSku && (
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <p className="font-semibold text-sm leading-tight">
                {resolveProductName(selectedSku)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedSku.brand} · {selectedSku.category}
              </p>
            </div>
          )}

          {/* ── Platform comparison table (default mode only) ── */}
          {mode !== "hyperlocal" && (
            !selectedSkuId ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Select a category and product above to compare pricing across platforms.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        { label: "Platform", align: "left", w: "min-w-[140px]" },
                        { label: "Price (₹)", align: "right", w: "min-w-[90px]" },
                        { label: "Discount %", align: "right", w: "min-w-[90px]" },
                        { label: "Promotion", align: "center", w: "min-w-[90px]" },
                        { label: "Promo Type", align: "left", w: "min-w-[120px]" },
                        { label: "Availability", align: "center", w: "min-w-[110px]" },
                      ].map((h) => (
                        <th
                          key={h.label}
                          className={`text-${h.align} py-2 px-3 font-medium text-muted-foreground ${h.w}`}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      if (!row.listed) {
                        return (
                          <tr
                            key={row.platform}
                            className="border-b border-border/40 last:border-0 opacity-50"
                          >
                            <td className="py-2.5 px-3 font-medium">{row.platform}</td>
                            <td
                              colSpan={5}
                              className="py-2.5 px-3 text-center text-xs text-muted-foreground italic"
                            >
                              Not Listed
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr
                          key={row.platform}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold">{row.platform}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            ₹{row.salePrice.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right ${discountColor(row.discountPct)}`}>
                            {row.discountPct.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <PromoBadge flag={row.promoFlag} />
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {row.promoFlag >= 0.5 ? row.promoType : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <AvailBadge flag={row.availFlag} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── Hyperlocal mode: prompt if no product selected ── */}
          {mode === "hyperlocal" && !selectedSkuId && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Select a category and product above to view hyperlocal price competition across pincodes.
            </p>
          )}

          {/* ── Hyperlocal Price Context (default mode) / Pincode Competition (hyperlocal mode) ── */}
          {mode === "hyperlocal" ? (
            pincodePriceRows.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                     <tr className="border-b border-border">
                        <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-left min-w-[110px]">City</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-left min-w-[90px]">Pincode</th>
                        {PLATFORMS.map((p) => (
                          <th key={p} className="py-2 px-3 font-medium text-muted-foreground text-xs text-right min-w-[110px]">{p}</th>
                        ))}
                        <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-right min-w-[100px]">Avg Price</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-right min-w-[110px]">City Avg Δ</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-center min-w-[150px]">Undercut Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pincodePriceRows.map((row, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 text-xs">{row.city}</td>
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold">{row.pincode}</td>
                          {PLATFORMS.map((p) => (
                            <td key={p} className="py-2.5 px-3 text-right font-mono text-xs">
                              {row.platformPrices[p] != null ? `₹${row.platformPrices[p]!.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-medium">
                            ₹{row.avgPrice.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono text-xs font-medium ${
                            row.cityAvgDelta <= -3 ? "text-status-low" :
                            row.cityAvgDelta >= 3 ? "text-status-medium" :
                            "text-muted-foreground"
                          }`}>
                            {row.cityAvgDelta > 0 ? "+" : ""}{row.cityAvgDelta.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.signal === "Undercutting Market" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-low">
                                <TrendingDown className="h-3 w-3" /> Undercutting Market
                              </span>
                            )}
                            {row.signal === "Premium Locality" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-medium">
                                <TrendingUp className="h-3 w-3" /> Premium Locality
                              </span>
                            )}
                            {row.signal === "In Line" && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Minus className="h-3 w-3" /> In Line
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            hyperlocalRows.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hyperlocal Price Context
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Average sale price by city · pincode · platform for the selected product
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        {["City", "Pincode", "Platform", "Avg Price"].map((h) => (
                          <th
                            key={h}
                            className={`py-1.5 px-3 font-medium text-muted-foreground text-xs ${
                              h === "Avg Price" ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hyperlocalRows.map((r, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-3 text-xs">{r.city}</td>
                          <td className="py-2 px-3 font-mono text-xs">{r.pincode}</td>
                          <td className="py-2 px-3 text-xs">{r.platform}</td>
                          <td className="py-2 px-3 text-right font-mono text-xs font-medium">
                            ₹{r.avgPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </section>
  );
}
