import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getEvents,
  getPriceData,
  getSearchData,
  getAvailabilityData,
  GlobalFilters,
  datasets,
  CompetitorEvent,
} from "@/data/dataLoader";
import { KPICard } from "@/components/dashboard/KPICard";
import { StrategicInsightsPanel, Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  TrendingDown,
  ShieldAlert,
  Zap,
  AlertTriangle,
  Minus,
  ChevronRight,
  X,
  BarChart2,
  Filter,
  Tag,
  Percent,
  Layers,
  Lightbulb,
  MousePointerClick,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}


function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function riskBand(ratio: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (ratio < 0.8) return { label: "High Risk", variant: "destructive" };
  if (ratio < 0.9) return { label: "Medium Risk", variant: "secondary" };
  return { label: "Stable", variant: "outline" };
}

const SEVERITY_CONFIG: Record<
  string,
  { variant: "destructive" | "secondary" | "outline" | "default"; color: string }
> = {
  Critical: { variant: "destructive", color: "hsl(var(--destructive))" },
  High:     { variant: "default",     color: "hsl(var(--status-high))" },
  Medium:   { variant: "secondary",   color: "hsl(var(--status-medium))" },
  Low:      { variant: "outline",     color: "hsl(var(--muted-foreground))" },
};

const EVENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "Flash Sale Wave": Zap,
  "Critical Stockout": AlertTriangle,
};

// ─── Unique values helper ─────────────────────────────────────────────────────
function uniqueSorted(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

// ─── Component ────────────────────────────────────────────────────────────────
const PLATFORMS = ["Blinkit", "Zepto", "Swiggy Instamart", "BigBasket Now"];

const CompetitiveEvents = () => {
  const filters = useOutletContext<GlobalFilters>();

  // ── Event filter state ───────────────────────────────────────────────────
  const [eventPlatform, setEventPlatform]   = useState("All");
  const [eventCity,     setEventCity]       = useState("All");
  const [eventCategory, setEventCategory]   = useState("All");
  const [eventSeverity, setEventSeverity]   = useState("All");
  const [selectedEvent, setSelectedEvent]   = useState<CompetitorEvent | null>(null);

  // ── All events (global filters) ──────────────────────────────────────────
  const allEvents = useMemo(
    () => getEvents(filters).sort((a, b) => b.date.localeCompare(a.date)),
    [filters]
  );

  // ── Option lists from events ─────────────────────────────────────────────
  const eventCities      = useMemo(() => uniqueSorted(allEvents.map((e) => e.city)), [allEvents]);
  const eventCategories  = useMemo(() => uniqueSorted(allEvents.map((e) => e.category)), [allEvents]);
  const eventPlatforms   = useMemo(() => uniqueSorted(allEvents.map((e) => e.platform)), [allEvents]);
  const eventSeverities  = useMemo(() => uniqueSorted(
    allEvents.map((e) => (e as unknown as { severity?: string }).severity ?? "")
  ), [allEvents]);

  // ── Filtered event rows ──────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const ev = e as unknown as { severity?: string };
      if (eventPlatform !== "All" && e.platform !== eventPlatform)     return false;
      if (eventCity     !== "All" && e.city     !== eventCity)         return false;
      if (eventCategory !== "All" && e.category !== eventCategory)     return false;
      if (eventSeverity !== "All" && (ev.severity ?? "") !== eventSeverity) return false;
      return true;
    });
  }, [allEvents, eventPlatform, eventCity, eventCategory, eventSeverity]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const flashSaleCount   = allEvents.filter((e) => e.event_type === "Flash Sale Wave").length;
  const stockoutCount    = allEvents.filter((e) => e.event_type === "Critical Stockout").length;
  const criticalCount    = allEvents.filter((e) => {
    const ev = e as unknown as { severity?: string };
    return ev.severity === "Critical";
  }).length;

  // ── Event Context: price market comparison ───────────────────────────────
  const marketComparison = useMemo(() => {
    if (!selectedEvent) return [];
    const ev = selectedEvent as unknown as {
      date: string; city: string; category: string; event_type: string;
    };

    const datePrefix = ev.date.slice(0, 10); // YYYY-MM-DD

    if (ev.event_type === "Flash Sale Wave") {
      // Use price_tracking
      const rows = datasets.priceTracking.filter(
        (r) =>
          r.date?.slice(0, 10) === datePrefix &&
          r.city === ev.city &&
          r.category === ev.category
      );
      const byPlatform: Record<string, { promoSum: number; discSum: number; priceSum: number; count: number }> = {};
      for (const r of rows) {
        if (!byPlatform[r.platform]) byPlatform[r.platform] = { promoSum: 0, discSum: 0, priceSum: 0, count: 0 };
        byPlatform[r.platform].promoSum  += r.promotion_flag;
        byPlatform[r.platform].discSum   += r.discount_percent;
        byPlatform[r.platform].priceSum  += r.sale_price;
        byPlatform[r.platform].count     += 1;
      }
      return PLATFORMS.map((p) => {
        const d = byPlatform[p];
        if (!d) return { platform: p, promoRate: null, avgDiscount: null, avgPrice: null, availRate: null };
        return {
          platform:   p,
          promoRate:  parseFloat(((d.promoSum / d.count) * 100).toFixed(1)),
          avgDiscount: parseFloat((d.discSum / d.count).toFixed(1)),
          avgPrice:   parseFloat((d.priceSum / d.count).toFixed(1)),
          availRate:  null,
        };
      });
    } else {
      // Critical Stockout: use availability_tracking
      const rows = datasets.availabilityTracking.filter(
        (r) =>
          r.date?.slice(0, 10) === datePrefix &&
          r.city === ev.city &&
          r.category === ev.category
      );
      const byPlatform: Record<string, { availSum: number; mustHaveSum: number; count: number }> = {};
      for (const r of rows) {
        if (!byPlatform[r.platform]) byPlatform[r.platform] = { availSum: 0, mustHaveSum: 0, count: 0 };
        byPlatform[r.platform].availSum    += r.availability_flag;
        byPlatform[r.platform].mustHaveSum += r.must_have_flag ?? 0;
        byPlatform[r.platform].count       += 1;
      }
      return PLATFORMS.map((p) => {
        const d = byPlatform[p];
        if (!d) return { platform: p, promoRate: null, avgDiscount: null, avgPrice: null, availRate: null };
        return {
          platform:    p,
          promoRate:   null,
          avgDiscount: null,
          avgPrice:    null,
          availRate:   parseFloat(((d.availSum / d.count) * 100).toFixed(1)),
        };
      });
    }
  }, [selectedEvent]);

  // ── Price Volatility ─────────────────────────────────────────────────────
  const skuNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of datasets.skuMaster) map[s.sku_id] = s.product_name;
    return map;
  }, []);

  const priceVolatility = useMemo(() => {
    const priceData = getPriceData(filters);
    const skuPrices: Record<string, { prices: number[]; product_name: string; category: string }> = {};
    for (const row of priceData) {
      if (!skuPrices[row.sku_id])
        skuPrices[row.sku_id] = { prices: [], product_name: row.product_name ?? skuNameMap[row.sku_id] ?? row.sku_id, category: row.category };
      skuPrices[row.sku_id].prices.push(row.sale_price);
    }
    return Object.entries(skuPrices)
      .map(([sku_id, { prices, product_name, category }]) => ({
        sku_id, product_name, category,
        price_volatility: parseFloat(stddev(prices).toFixed(2)),
      }))
      .sort((a, b) => b.price_volatility - a.price_volatility)
      .slice(0, 10);
  }, [filters]);

  // ── Search Rank Volatility ───────────────────────────────────────────────
  const searchVolatility = useMemo(() => {
    const searchData = getSearchData(filters);
    const kwRanks: Record<string, number[]> = {};
    for (const row of searchData) {
      if (!kwRanks[row.keyword]) kwRanks[row.keyword] = [];
      kwRanks[row.keyword].push(row.search_rank);
    }
    return Object.entries(kwRanks)
      .map(([keyword, ranks]) => ({
        keyword,
        rank_volatility: parseFloat(stddev(ranks).toFixed(2)),
        observations: ranks.length,
      }))
      .sort((a, b) => b.rank_volatility - a.rank_volatility)
      .slice(0, 10);
  }, [filters]);

  // ── SKU Availability Risk ────────────────────────────────────────────────
  const availRisk = useMemo(() => {
    const availData = getAvailabilityData(filters);
    const skuFlags: Record<string, { sum: number; count: number; product_name: string; category: string }> = {};
    for (const row of availData) {
      if (!skuFlags[row.sku_id])
        skuFlags[row.sku_id] = { sum: 0, count: 0, product_name: row.product_name ?? skuNameMap[row.sku_id] ?? row.sku_id, category: row.category };
      skuFlags[row.sku_id].sum += row.availability_flag;
      skuFlags[row.sku_id].count += 1;
    }
    return Object.entries(skuFlags)
      .map(([sku_id, { sum, count, product_name, category }]) => ({
        sku_id, product_name, category,
        availability_ratio: parseFloat((sum / count).toFixed(3)),
      }))
      .sort((a, b) => a.availability_ratio - b.availability_ratio)
      .slice(0, 20);
  }, [filters]);

  // ── Strategic Insights ────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    const topVolatileSku = priceVolatility[0];
    const topVolatileKw  = searchVolatility[0];
    const highRiskCount  = availRisk.filter((s) => s.availability_ratio < 0.8).length;
    const mostFrequentEventType = Object.entries(
      allEvents.reduce<Record<string, number>>((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    // Top 3 Selection Gap events
    const topSelectionGaps = allEvents
      .filter((e) => e.event_type === "Selection Gap")
      .slice(0, 3);

    const list: Insight[] = [];
    if (topVolatileSku) {
      list.push({
        icon: "trend-down",
        title: "Highest Price Volatility",
        body: `"${topVolatileSku.product_name}" shows the highest price volatility (σ ₹${topVolatileSku.price_volatility}) in the ${topVolatileSku.category} category, signalling aggressive competitor pricing activity.`,
        type: "warning",
      });
    }
    if (topVolatileKw) {
      list.push({
        icon: "search",
        title: "Unstable Search Keyword",
        body: `The keyword "${topVolatileKw.keyword}" has the highest rank volatility (σ ${topVolatileKw.rank_volatility}), meaning search positions are shifting frequently.`,
        type: "warning",
      });
    }
    if (highRiskCount > 0) {
      list.push({
        icon: "shield",
        title: "High-Risk SKU Availability",
        body: `${highRiskCount} SKU${highRiskCount > 1 ? "s are" : " is"} in the High Risk band with availability below 80%, indicating frequent stockouts.`,
        type: "critical",
      });
    }
    if (mostFrequentEventType) {
      list.push({
        icon: "zap",
        title: "Dominant Event Type",
        body: `"${mostFrequentEventType[0]}" is the most frequently detected competitive event (${mostFrequentEventType[1]} occurrences).`,
        type: "neutral",
      });
    }
    if (topSelectionGaps.length > 0) {
      list.push({
        icon: "package",
        title: "Top Selection Gaps",
        body: topSelectionGaps.map((e) => e.description).join(" "),
        type: "warning",
      });
    }
    return list;
  }, [priceVolatility, searchVolatility, availRisk, allEvents]);

  const kpis = [
    { title: "Events Detected",   value: allEvents.length.toString(),   trend: "neutral" as const, tooltip: "Total competitive events in the filtered dataset" },
    { title: "Flash Sale Waves",  value: flashSaleCount.toString(),     trend: flashSaleCount > 0 ? "up" as const : "neutral" as const,   status: flashSaleCount > 3  ? "medium" as const : "low" as const, tooltip: "Flash Sale Wave events detected" },
    { title: "Critical Stockouts",value: stockoutCount.toString(),      trend: stockoutCount > 0 ? "down" as const : "neutral" as const,  status: stockoutCount > 2   ? "high"   as const : "low" as const, tooltip: "Critical Stockout events detected" },
    { title: "Critical Severity", value: criticalCount.toString(),      trend: criticalCount > 0 ? "down" as const : "neutral" as const,  status: criticalCount > 0   ? "high"   as const : "low" as const, tooltip: "Events flagged as Critical severity" },
  ];


  const selEv = selectedEvent as unknown as (CompetitorEvent & {
    severity?: string; market_scope?: string;
    platform_promo_share?: number | null; market_avg_promo?: number | null;
  }) | null;

  const isFlashSale   = selEv?.event_type === "Flash Sale Wave";
  const isStockout    = selEv?.event_type === "Critical Stockout";

  // Promotion intensity indicator
  const promoIntensity = (() => {
    if (!selEv || selEv.platform_promo_share == null || selEv.market_avg_promo == null) return null;
    const delta = selEv.platform_promo_share - selEv.market_avg_promo;
    if (delta > 0.05) return "above";
    if (delta < -0.05) return "below";
    return "inline";
  })();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Competitive Risk &amp; Event Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Click any event to explore triggers, market context, and competitor activity
          </p>
        </div>
      </div>

      <PageControlBar exportLabel="competitor_events" exportData={allEvents as unknown as Record<string, unknown>[]} />

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {/* Strategic Insights */}
      <StrategicInsightsPanel insights={insights} />

      {/* ═══════════════════════════════════════════════════════════════════════
          EVENT INTELLIGENCE PANEL — two-column layout
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Event Intelligence</h2>
        </div>

        {/* Filters bar */}
        <Card className="bg-gradient-card">
          <CardContent className="py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Select value={eventPlatform} onValueChange={setEventPlatform}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Platforms</SelectItem>
                  {eventPlatforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventCity} onValueChange={setEventCity}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Cities</SelectItem>
                  {eventCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventCategory} onValueChange={setEventCategory}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {eventCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventSeverity} onValueChange={setEventSeverity}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Severity</SelectItem>
                  {eventSeverities.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Two-column: timeline left, context right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── LEFT: Event Timeline ─────────────────────────────────────── */}
          <Card className="bg-gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Event Timeline</CardTitle>
              <CardDescription className="text-xs">Click a row to explore intelligence on the right</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center px-4">No events match the selected filters.</p>
              ) : (
                <ScrollArea className="h-[480px]">
                  <div className="space-y-0 px-4">
                    {filteredEvents.map((e, i) => {
                       const ev = e as unknown as CompetitorEvent & { severity?: string };
                      const sevCfg = SEVERITY_CONFIG[ev.severity ?? "Low"] ?? SEVERITY_CONFIG["Low"];
                      const EventIcon = EVENT_ICONS[e.event_type] ?? Activity;
                      const isSelected = selectedEvent === e;

                      // ── Display label + left-border override ──────────────
                      const COMPETITOR_PLATFORMS = ["Blinkit", "Swiggy Instamart", "BigBasket Now"];
                      const isSelectionGap = e.event_type === "Selection Gap";
                      const isCompetitorStockout =
                        e.event_type === "Critical Stockout" &&
                        COMPETITOR_PLATFORMS.includes(e.platform);
                      const displayLabel = isSelectionGap
                        ? "Regional Selection Gap"
                        : isCompetitorStockout
                        ? "Competitor Stockout"
                        : e.event_type;
                      const leftBorderStyle = isSelectionGap
                        ? { borderLeft: "3px solid hsl(var(--destructive))" }
                        : isCompetitorStockout
                        ? { borderLeft: "3px solid hsl(var(--status-medium))" }
                        : {};

                      return (
                        <div
                          key={e.event_id ?? i}
                          onClick={() => setSelectedEvent(isSelected ? null : e)}
                          style={leftBorderStyle}
                          className={`flex items-start gap-3 py-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors rounded-sm px-2 -mx-2 ${
                            isSelectionGap || isCompetitorStockout ? "pl-3" : ""
                          } ${
                            isSelected
                              ? "bg-primary/8 ring-1 ring-inset ring-primary/20"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          {/* Timeline dot + icon */}
                          <div className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                            isSelected ? "bg-primary/15" : "bg-muted"
                          }`}>
                            <EventIcon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : ""}`}>
                                {displayLabel}
                              </span>
                              <Badge variant={sevCfg.variant} className="text-xs shrink-0 py-0 h-5">
                                {ev.severity ?? "Low"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{e.description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="font-medium text-foreground/70">{e.platform}</span>
                              <span>·</span>
                              <span>{e.city}</span>
                              <span>·</span>
                              <span className="truncate max-w-[120px]">{e.category}</span>
                            </div>
                          </div>

                          {/* Date + chevron */}
                          <div className="text-right shrink-0 space-y-1">
                            <p className="text-xs font-mono text-muted-foreground">{formatDate(e.date)}</p>
                            <ChevronRight
                              className={`h-4 w-4 ml-auto transition-transform ${
                                isSelected ? "rotate-90 text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* ── RIGHT: Event Context Panel ───────────────────────────────── */}
          <div className="lg:sticky lg:top-4 space-y-4">
            {!selEv ? (
              /* Placeholder when nothing is selected */
              <Card className="bg-gradient-card border-dashed border-border/60">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Select an event</p>
                    <p className="text-xs text-muted-foreground mt-1">Click any row in the timeline to see event context, affected category, discount level, impacted platforms, and strategic implication.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">

                {/* ── Context card ─────────────────────────────────────── */}
                <Card className="bg-gradient-card border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isFlashSale
                          ? <Zap className="h-4 w-4 text-primary shrink-0" />
                          : <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        }
                        <CardTitle className="text-base leading-snug">Event Context</CardTitle>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0 -mt-1 -mr-1"
                        onClick={() => setSelectedEvent(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">{selEv.description}</p>

                    {/* Key fields grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start gap-2 col-span-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Affected Category</p>
                          <p className="text-sm font-semibold">{selEv.category}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Discount Level</p>
                          <p className="text-sm font-semibold">
                            {selEv.discount_percent != null && selEv.discount_percent > 0
                              ? `${selEv.discount_percent}%`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Impacted Platform</p>
                          <p className="text-sm font-semibold">{selEv.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Severity</p>
                          <p className="text-sm font-semibold">{selEv.severity ?? "Low"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Market Scope</p>
                          <p className="text-sm font-semibold">
                            {selEv.market_scope
                              ? selEv.market_scope.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Strategic Implication */}
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Strategic Implication</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isFlashSale
                            ? `${selEv.platform} is running a flash promotion in ${selEv.city} for ${selEv.category}${selEv.discount_percent > 0 ? ` at ${selEv.discount_percent}% off` : ""}. Monitor competitor response and consider matching or countering the offer to protect share.`
                            : `A critical stockout was detected on ${selEv.platform} in ${selEv.city} for ${selEv.category}. ${selEv.market_scope === "stockout_cluster" ? "This cluster-level event signals a possible supply chain issue — escalate to procurement immediately." : "This is an isolated event — track for 48 hours before escalating."}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Promo intensity (flash sales only) */}
                    {isFlashSale && selEv.platform_promo_share != null && selEv.market_avg_promo != null && (
                      <div className="border border-border/60 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Promotion Intensity</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-20 text-muted-foreground shrink-0">{selEv.platform}</span>
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(selEv.platform_promo_share * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-mono w-9 text-right">{(selEv.platform_promo_share * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-20 text-muted-foreground shrink-0">Market avg</span>
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${Math.min(selEv.market_avg_promo * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-mono w-9 text-right">{(selEv.market_avg_promo * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        {promoIntensity && (
                          <div className={`flex items-center gap-1.5 text-xs font-semibold mt-1 ${
                            promoIntensity === "above" ? "text-destructive" :
                            promoIntensity === "below" ? "text-status-low" : "text-muted-foreground"
                          }`}>
                            {promoIntensity === "above" ? <TrendingDown className="h-3.5 w-3.5" /> :
                             promoIntensity === "below" ? <TrendingDown className="h-3.5 w-3.5 rotate-180" /> :
                             <Minus className="h-3.5 w-3.5" />}
                            {promoIntensity === "above" ? "Above market baseline" :
                             promoIntensity === "below" ? "Below market baseline" : "Inline with market"}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stockout alert */}
                    {isStockout && (
                      <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <p className="text-sm font-semibold">Must-have SKU availability drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selEv.market_scope === "stockout_cluster"
                            ? "Stockout cluster across the city — possible supply chain disruption."
                            : "Isolated stockout — monitor for escalation."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Market Comparison card ───────────────────────────── */}
                <Card className="bg-gradient-card border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Market Comparison</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {selEv.city} · {selEv.category} · {formatDate(selEv.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isFlashSale ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="py-2 pr-3 font-medium text-muted-foreground">Platform</th>
                              <th className="py-2 pr-3 font-medium text-muted-foreground text-right">Promo</th>
                              <th className="py-2 pr-3 font-medium text-muted-foreground text-right">Disc.</th>
                              <th className="py-2 font-medium text-muted-foreground text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketComparison.map((row) => {
                              const isEventPlatform = row.platform === selEv.platform;
                              return (
                                <tr key={row.platform} className={`border-b border-border/50 last:border-0 ${isEventPlatform ? "bg-primary/5 font-semibold" : ""}`}>
                                  <td className="py-2 pr-3">
                                    <span className="flex items-center gap-1.5">
                                      {isEventPlatform && <Zap className="h-3 w-3 text-primary shrink-0" />}
                                      <span className={`text-xs ${isEventPlatform ? "text-primary" : ""}`}>{row.platform}</span>
                                    </span>
                                  </td>
                                  <td className="py-2 pr-3 text-right font-mono text-xs">
                                    {row.promoRate != null ? <span className={row.promoRate > 20 ? "text-destructive font-bold" : ""}>{row.promoRate}%</span> : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className="py-2 pr-3 text-right font-mono text-xs">
                                    {row.avgDiscount != null ? `${row.avgDiscount}%` : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className="py-2 text-right font-mono text-xs">
                                    {row.avgPrice != null ? `₹${row.avgPrice}` : <span className="text-muted-foreground">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {marketComparison.every((r) => r.promoRate == null) && (
                          <p className="text-xs text-muted-foreground text-center py-4">No price data for this date, city &amp; category.</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="py-2 pr-4 font-medium text-muted-foreground">Platform</th>
                              <th className="py-2 font-medium text-muted-foreground text-right">Availability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketComparison.map((row) => {
                              const isEventPlatform = row.platform === selEv.platform;
                              const band = row.availRate != null ? riskBand(row.availRate / 100) : null;
                              return (
                                <tr key={row.platform} className={`border-b border-border/50 last:border-0 ${isEventPlatform ? "bg-destructive/5 font-semibold" : ""}`}>
                                  <td className="py-2.5 pr-4">
                                    <span className="flex items-center gap-1.5">
                                      {isEventPlatform && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                                      <span className={`text-xs ${isEventPlatform ? "text-destructive" : ""}`}>{row.platform}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right">
                                    {row.availRate != null ? (
                                      <span className="inline-flex items-center gap-2 justify-end">
                                        <span className="font-mono text-xs">{row.availRate}%</span>
                                        {band && <Badge variant={band.variant} className="text-xs py-0 h-5">{band.label}</Badge>}
                                      </span>
                                    ) : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {marketComparison.every((r) => r.availRate == null) && (
                          <p className="text-xs text-muted-foreground text-center py-4">No availability data for this date, city &amp; category.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default CompetitiveEvents;
