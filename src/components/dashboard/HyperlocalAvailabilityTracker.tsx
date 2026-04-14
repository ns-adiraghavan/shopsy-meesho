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
import { MapPin, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"] as const;

interface Props {
  filters: Partial<GlobalFilters>;
}

type AvailStatus = "in_stock" | "out_of_stock" | null;

function AvailBadge({ status }: { status: AvailStatus }) {
  if (status === "in_stock")
    return (
      <Badge className="bg-status-low/15 text-status-low border border-status-low/30 text-xs font-medium whitespace-nowrap">
        ✅ In Stock
      </Badge>
    );
  if (status === "out_of_stock")
    return (
      <Badge className="bg-status-medium/15 text-status-medium border border-status-medium/30 text-xs font-medium whitespace-nowrap">
        ⚠️ Out of Stock
      </Badge>
    );
  return <span className="text-xs text-muted-foreground">—</span>;
}

/** Compute per-pincode rows for a given SKU against pre-filtered availability data */
function buildTableRows(
  skuId: string,
  availData: (typeof datasets.availabilityTracking)
) {
  const rows = availData.filter((r) => r.sku_id === skuId && r.pincode && r.city);
  if (rows.length === 0) return [];

  const grouped: Record<string, { sum: number; count: number; city: string; pincode: string; platform: string }> = {};
  for (const r of rows) {
    const key = `${r.city}||${r.pincode}||${r.platform}`;
    if (!grouped[key]) grouped[key] = { sum: 0, count: 0, city: r.city, pincode: r.pincode!, platform: r.platform };
    grouped[key].sum += r.availability_flag;
    grouped[key].count++;
  }

  const locationMap: Record<string, { city: string; pincode: string; platforms: Record<string, AvailStatus> }> = {};
  for (const { city, pincode, platform, sum, count } of Object.values(grouped)) {
    const locKey = `${city}||${pincode}`;
    if (!locationMap[locKey]) locationMap[locKey] = { city, pincode, platforms: {} };
    locationMap[locKey].platforms[platform] = sum / count >= 0.5 ? "in_stock" : "out_of_stock";
  }

  return Object.values(locationMap).map(({ city, pincode, platforms }) => {
    const zeptoStatus = platforms["Zepto"] ?? null;
    const competitorOutOfStock = PLATFORMS.some((p) => p !== "Zepto" && platforms[p] === "out_of_stock");
    return {
      city,
      pincode,
      statuses: platforms as Record<string, AvailStatus>,
      isIntercept: zeptoStatus === "in_stock" && competitorOutOfStock,
    };
  });
}

/** Returns true if a SKU has at least one pincode with an intercept opportunity */
function hasInterceptOpportunity(
  skuId: string,
  availData: (typeof datasets.availabilityTracking)
): boolean {
  return buildTableRows(skuId, availData).some((r) => r.isIntercept);
}

export function HyperlocalAvailabilityTracker({ filters }: Props) {
  const categories = useMemo(
    () => Array.from(new Set(datasets.skuMaster.map((s) => s.category))).sort(),
    []
  );

  const globalCategory =
    filters.category && filters.category !== "All Categories" ? filters.category : null;

  const [selectedCategory, setSelectedCategory] = useState<string>(globalCategory ?? "");
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  const [interceptFilterOn, setInterceptFilterOn] = useState(false);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSkuId("");
  };

  const handleInterceptToggle = () => {
    setInterceptFilterOn((v) => !v);
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

  // Pre-filter availability data once
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

  // When toggle is on, restrict product dropdown to SKUs with ≥1 intercept opportunity
  const interceptSkuIds = useMemo<Set<string>>(() => {
    if (!interceptFilterOn || !selectedCategory) return new Set();
    const s = new Set<string>();
    for (const sku of productsInCategory) {
      if (hasInterceptOpportunity(sku.sku_id, availFiltered)) s.add(sku.sku_id);
    }
    return s;
  }, [interceptFilterOn, selectedCategory, productsInCategory, availFiltered]);

  const visibleProducts = useMemo(
    () => interceptFilterOn ? productsInCategory.filter((s) => interceptSkuIds.has(s.sku_id)) : productsInCategory,
    [interceptFilterOn, productsInCategory, interceptSkuIds]
  );

  const tableRows = useMemo(() => {
    if (!selectedSkuId) return [];
    return buildTableRows(selectedSkuId, availFiltered)
      .sort((a, b) => a.city.localeCompare(b.city) || a.pincode.localeCompare(b.pincode));
  }, [selectedSkuId, availFiltered]);

  const interceptCount = tableRows.filter((r) => r.isIntercept).length;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Hyperlocal Availability Tracker
      </h2>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <CardTitle>Hyperlocal Availability Tracker</CardTitle>
              <CardDescription>
                Track per-pincode availability across platforms for a selected SKU — identify
                pincodes where Zepto is in stock while competitors are out
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Selectors + intercept toggle */}
          <div className="flex flex-wrap items-end gap-3">
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

            <div className="space-y-1 min-w-[240px] flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Product
                {interceptFilterOn && selectedCategory && (
                  <span className="ml-1.5 normal-case text-primary font-semibold">
                    — {visibleProducts.length} SKU{visibleProducts.length !== 1 ? "s" : ""} with opportunities
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
                        : interceptFilterOn && visibleProducts.length === 0
                        ? "No intercept opportunities in this category"
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

            {/* Intercept filter toggle */}
            <div className="pb-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleInterceptToggle}
                className={
                  interceptFilterOn
                    ? "h-9 gap-1.5 border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary text-xs"
                    : "h-9 gap-1.5 text-xs"
                }
              >
                <Rocket className="h-3.5 w-3.5" />
                {interceptFilterOn ? "Showing Intercepts Only" : "Show Intercept Opportunities Only"}
              </Button>
            </div>

            {selectedSkuId && interceptCount > 0 && (
              <div className="pb-0.5">
                <Badge className="text-xs font-medium gap-1 bg-primary/10 text-primary border border-primary/25">
                  🚀 {interceptCount} intercept opportunit{interceptCount !== 1 ? "ies" : "y"}
                </Badge>
              </div>
            )}
          </div>

          {/* Active geo-filter context */}
          {((filters.city && filters.city !== "All Cities") || (filters.pincode && filters.pincode !== "All Pincodes")) && (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground items-center">
              <span className="font-medium">Filters active:</span>
              {filters.city && filters.city !== "All Cities" && (
                <Badge variant="secondary" className="text-xs font-normal">{filters.city}</Badge>
              )}
              {filters.pincode && filters.pincode !== "All Pincodes" && (
                <Badge variant="secondary" className="text-xs font-normal">{filters.pincode}</Badge>
              )}
            </div>
          )}

          {/* Table */}
          {!selectedSkuId ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {interceptFilterOn && selectedCategory && visibleProducts.length === 0
                ? "No intercept opportunities found in this category under current filters."
                : "Select a category and product to view hyperlocal availability."}
            </p>
          ) : tableRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No pincode-level availability data found for this SKU under current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[110px]">City</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[90px]">Pincode</th>
                    {PLATFORMS.map((p) => (
                      <th key={p} className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[130px]">
                        {p}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[160px]">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr
                      key={`${row.city}||${row.pincode}`}
                      className={
                        row.isIntercept
                          ? "border-b border-border/40 bg-primary/5"
                          : "border-b border-border/40 hover:bg-muted/30 transition-colors"
                      }
                    >
                      <td className="py-2.5 px-3 font-medium">{row.city}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{row.pincode}</td>
                      {PLATFORMS.map((platform) => (
                        <td key={platform} className="py-2.5 px-3 text-center">
                          <AvailBadge status={row.statuses[platform] ?? null} />
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-center">
                        {row.isIntercept && (
                          <Badge className="bg-primary/10 text-primary border border-primary/25 text-xs font-medium whitespace-nowrap">
                            🚀 Intercept Opportunity
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-low/30 bg-status-low/15 px-2 py-0.5 text-status-low text-[10px] font-medium">✅ In Stock</span>
              <span>availability_flag = 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-medium/30 bg-status-medium/15 px-2 py-0.5 text-status-medium text-[10px] font-medium">⚠️ Out of Stock</span>
              <span>availability_flag = 0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary text-[10px] font-medium">🚀 Intercept Opportunity</span>
              <span>Zepto in stock, ≥1 competitor out</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
