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
import { Layers, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"] as const;

interface Props {
  filters: Partial<GlobalFilters>;
}

type StatusKey = "not_listed" | "out_of_stock" | "in_stock";

function StatusBadge({ status }: { status: StatusKey }) {
  if (status === "not_listed")
    return (
      <Badge className="bg-destructive/10 text-destructive border border-destructive/30 text-xs font-medium whitespace-nowrap">
        ❌ Not Listed
      </Badge>
    );
  if (status === "out_of_stock")
    return (
      <Badge className="bg-status-medium/15 text-status-medium border border-status-medium/30 text-xs font-medium whitespace-nowrap">
        ⚠️ Out of Stock
      </Badge>
    );
  return (
    <Badge className="bg-status-low/15 text-status-low border border-status-low/30 text-xs font-medium whitespace-nowrap">
      ✅ In Stock
    </Badge>
  );
}

/** Derive per-platform statuses for a single SKU given pre-filtered assortment + availability rows */
function computeStatuses(
  skuId: string,
  assortAllFiltered: ReturnType<typeof applyFilters<(typeof datasets.assortmentTracking)[number]>>,
  availAllFiltered: ReturnType<typeof applyFilters<(typeof datasets.availabilityTracking)[number]>>
): Record<string, StatusKey> {
  const assortRows = assortAllFiltered.filter((r) => r.sku_id === skuId);
  const availRows = availAllFiltered.filter((r) => r.sku_id === skuId);
  const result: Record<string, StatusKey> = {};

  for (const platform of PLATFORMS) {
    const asmtRows = assortRows.filter((r) => r.platform === platform);
    const avlRows = availRows.filter((r) => r.platform === platform);

    const listingAvg =
      asmtRows.length > 0
        ? asmtRows.reduce((s, r) => s + r.listing_status, 0) / asmtRows.length
        : 0;

    if (asmtRows.length === 0 || listingAvg < 0.5) {
      result[platform] = "not_listed";
      continue;
    }

    const availAvg =
      avlRows.length > 0
        ? avlRows.reduce((s, r) => s + r.availability_flag, 0) / avlRows.length
        : 0;

    result[platform] = availAvg >= 0.5 ? "in_stock" : "out_of_stock";
  }
  return result;
}

function isGap(statuses: Record<string, StatusKey>): boolean {
  if (statuses["Zepto"] !== "not_listed") return false;
  return PLATFORMS.filter((p) => p !== "Zepto" && statuses[p] === "in_stock").length >= 2;
}

export function CrossPlatformSelectionBenchmarking({ filters }: Props) {
  const categories = useMemo(
    () => Array.from(new Set(datasets.skuMaster.map((s) => s.category))).sort(),
    []
  );

  const globalCategory =
    filters.category && filters.category !== "All Categories" ? filters.category : null;

  const [selectedCategory, setSelectedCategory] = useState<string>(globalCategory ?? "");
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  const [gapFilterOn, setGapFilterOn] = useState(false);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSkuId("");
  };

  const handleGapToggle = () => {
    setGapFilterOn((v) => !v);
    setSelectedSkuId("");
  };

  const baseFilters: Partial<GlobalFilters> = useMemo(
    () => ({
      city: filters.city,
      pincode: filters.pincode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
    [filters.city, filters.pincode, filters.dateFrom, filters.dateTo]
  );

  // Pre-filter datasets once (no category filter — we filter by SKU)
  const assortFiltered = useMemo(
    () => applyFilters(datasets.assortmentTracking, baseFilters),
    [baseFilters]
  );
  const availFiltered = useMemo(
    () => applyFilters(datasets.availabilityTracking, baseFilters),
    [baseFilters]
  );

  const productsInCategory = useMemo(
    () =>
      datasets.skuMaster
        .filter((s) => s.category === selectedCategory)
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.sku_id.localeCompare(b.sku_id)),
    [selectedCategory]
  );

  // When gap filter is on, compute statuses for all SKUs in the category and keep only gaps
  const gapSkuIds = useMemo<Set<string>>(() => {
    if (!gapFilterOn || !selectedCategory) return new Set();
    const s = new Set<string>();
    for (const sku of productsInCategory) {
      const statuses = computeStatuses(sku.sku_id, assortFiltered, availFiltered);
      if (isGap(statuses)) s.add(sku.sku_id);
    }
    return s;
  }, [gapFilterOn, selectedCategory, productsInCategory, assortFiltered, availFiltered]);

  const visibleProducts = useMemo(
    () =>
      gapFilterOn
        ? productsInCategory.filter((s) => gapSkuIds.has(s.sku_id))
        : productsInCategory,
    [gapFilterOn, productsInCategory, gapSkuIds]
  );

  const selectedSku = useMemo(
    () => (selectedSkuId ? datasets.skuMaster.find((s) => s.sku_id === selectedSkuId) ?? null : null),
    [selectedSkuId]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isRegional = selectedSku ? Boolean((selectedSku as any).is_regional) : false;

  const platformStatuses = useMemo((): Record<string, StatusKey> => {
    if (!selectedSkuId) return {};
    return computeStatuses(selectedSkuId, assortFiltered, availFiltered);
  }, [selectedSkuId, assortFiltered, availFiltered]);

  const isActionableGap = selectedSkuId ? isGap(platformStatuses) : false;
  const hasData = selectedSkuId && Object.keys(platformStatuses).length > 0;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Cross-Platform Selection Benchmarking
      </h2>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <div>
              <CardTitle>Cross-Platform Selection Benchmarking</CardTitle>
              <CardDescription>
                Compare listing and availability status of a product across platforms — identify
                selection gaps where a SKU is unlisted on one platform while available on others
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Selectors + gap filter toggle */}
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
                {gapFilterOn && selectedCategory && (
                  <span className="ml-1.5 normal-case text-destructive font-semibold">
                    — {visibleProducts.length} gap{visibleProducts.length !== 1 ? "s" : ""} found
                  </span>
                )}
              </label>
              <Select
                value={selectedSkuId}
                onValueChange={setSelectedSkuId}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue
                    placeholder={
                      !selectedCategory
                        ? "Select a category first"
                        : gapFilterOn && visibleProducts.length === 0
                        ? "No actionable gaps in this category"
                        : "Select product…"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {visibleProducts.map((s) => (
                    <SelectItem key={s.sku_id} value={s.sku_id}>
                      {s.product_name || s.sku_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gap filter toggle */}
            <div className="pb-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGapToggle}
                className={
                  gapFilterOn
                    ? "h-9 gap-1.5 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive text-xs"
                    : "h-9 gap-1.5 text-xs"
                }
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {gapFilterOn ? "Showing Gaps Only" : "Show Actionable Gaps Only"}
              </Button>
            </div>

            {selectedCategory && !gapFilterOn && (
              <div className="pb-0.5">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  {selectedCategory} · {productsInCategory.length} product
                  {productsInCategory.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* Actionable gap banner */}
          {isActionableGap && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-semibold text-destructive">Actionable Selection Gap Detected</span>
              <span className="text-xs text-destructive/80">
                — Zepto is not listing this SKU while competitors carry it
              </span>
            </div>
          )}

          {/* Results */}
          {!selectedSkuId ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {gapFilterOn && selectedCategory && visibleProducts.length === 0
                ? "No actionable selection gaps found in this category under current filters."
                : "Select a category and product to view listing status across platforms."}
            </p>
          ) : !hasData ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No assortment data found for the selected SKU under current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[220px]">
                      Product Name
                    </th>
                    {PLATFORMS.map((p) => (
                      <th key={p} className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[140px]">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={
                      isActionableGap
                        ? "border-b border-border/40 bg-destructive/5"
                        : "border-b border-border/40"
                    }
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        {isActionableGap && (
                          <div className="w-1 self-stretch rounded-full bg-destructive shrink-0 -ml-1 mr-1" />
                        )}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium leading-tight">
                              {selectedSku?.product_name || selectedSkuId}
                            </span>
                            {isRegional && (
                              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Regional
                              </span>
                            )}
                          </div>
                          {isActionableGap && (
                            <span className="inline-flex items-center text-[10px] font-semibold text-destructive uppercase tracking-wider">
                              Actionable Selection Gap
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {selectedSku?.brand} · {selectedSku?.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {PLATFORMS.map((platform) => (
                      <td key={platform} className="py-3 px-3 text-center">
                        {platformStatuses[platform] ? (
                          <StatusBadge status={platformStatuses[platform]} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-low/30 bg-status-low/15 px-2 py-0.5 text-status-low text-[10px] font-medium">✅ In Stock</span>
              <span>listing_status=1 & available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-medium/30 bg-status-medium/15 px-2 py-0.5 text-status-medium text-[10px] font-medium">⚠️ Out of Stock</span>
              <span>listing_status=1 & unavailable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive text-[10px] font-medium">❌ Not Listed</span>
              <span>listing_status=0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
