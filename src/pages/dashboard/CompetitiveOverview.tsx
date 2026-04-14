import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { datasets } from "@/data/dataLoader";

/* ------------------------------------------------------------------ */
/*  Section 1 — Dual-value KPI cards                                  */
/* ------------------------------------------------------------------ */

interface DualKPIProps {
  title: string;
  shopsyValue: string;
  meeshoValue: string;
  shopsyHighlight?: "green" | "red" | "amber" | "none";
  meeshoHighlight?: "green" | "red" | "amber" | "none";
  tooltip?: string;
  subtitle?: string;
}

const highlightColor = (h?: string) => {
  switch (h) {
    case "green":
      return "text-emerald-600 dark:text-emerald-400";
    case "red":
      return "text-red-600 dark:text-red-400";
    case "amber":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "";
  }
};

function DualKPICard({ title, shopsyValue, meeshoValue, shopsyHighlight = "none", meeshoHighlight = "none", tooltip, subtitle }: DualKPIProps) {
  return (
    <TooltipProvider>
      <Card className="bg-gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {title}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </CardTitle>
          {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Shopsy</p>
              <p className={cn("text-xl font-bold", highlightColor(shopsyHighlight))}>{shopsyValue}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Meesho</p>
              <p className={cn("text-xl font-bold", highlightColor(meeshoHighlight))}>{meeshoValue}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 2 — Category Pressure Map                                 */
/* ------------------------------------------------------------------ */

type CellColor = "red" | "green" | "amber";

interface PressureRow {
  category: string;
  priceGap: { value: string; color: CellColor };
  promoGap: { value: string; color: CellColor };
  assortmentGap: { value: string; color: CellColor };
}

const pressureData: PressureRow[] = [
  { category: "Women's Western Wear",   priceGap: { value: "+12%", color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Behind", color: "red" } },
  { category: "Women's Ethnic Wear",    priceGap: { value: "+8%",  color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Behind", color: "red" } },
  { category: "Men's Casual Wear",      priceGap: { value: "\u22122%",  color: "green" }, promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Ahead",  color: "green" } },
  { category: "Kidswear",               priceGap: { value: "+5%",  color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Even",   color: "amber" } },
  { category: "Innerwear & Loungewear", priceGap: { value: "\u22121%",  color: "green" }, promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Ahead",  color: "green" } },
  { category: "Footwear",               priceGap: { value: "\u22123%",  color: "green" }, promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Ahead",  color: "green" } },
  { category: "Beauty & Skincare",      priceGap: { value: "+10%", color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Behind", color: "red" } },
  { category: "Accessories",            priceGap: { value: "+14%", color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Behind", color: "red" } },
  { category: "Home & Kitchen",         priceGap: { value: "+6%",  color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Even",   color: "amber" } },
  { category: "Men's Ethnic Wear",      priceGap: { value: "+4%",  color: "red" },   promoGap: { value: "Higher", color: "red" }, assortmentGap: { value: "Even",   color: "amber" } },
];

const cellBg = (color: CellColor) => {
  switch (color) {
    case "red":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "green":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "amber":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }
};

/* ------------------------------------------------------------------ */
/*  Section 3 — Competitor Event Feed                                 */
/* ------------------------------------------------------------------ */

const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const severityBadge = (severity: string) => {
  switch (severity) {
    case "Critical":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{severity}</Badge>;
    case "High":
      return <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">{severity}</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{severity}</Badge>;
  }
};

const severityIcon = (severity: string) => {
  switch (severity) {
    case "Critical":
      return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case "High":
      return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function CompetitiveOverview() {
  const events = useMemo(() => {
    return [...datasets.competitorEvents].sort((a, b) => {
      const s = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
      if (s !== 0) return s;
      return b.date.localeCompare(a.date);
    });
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Section 1 -- KPI Bar */}
      <section>
        <h1 className="text-lg font-semibold mb-3">Competitive Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <DualKPICard
            title="Competitiveness Score"
            shopsyValue="59"
            meeshoValue="65"
            shopsyHighlight="red"
            subtitle="Composite 0\u2013100"
          />
          <DualKPICard
            title="Avg Price Gap"
            shopsyValue="+13.5%"
            meeshoValue="\u221213%"
            shopsyHighlight="red"
            meeshoHighlight="green"
            tooltip="Positive = this platform is more expensive vs competitor"
          />
          <DualKPICard
            title="Promo Rate"
            shopsyValue="14.8%"
            meeshoValue="23%"
            meeshoHighlight="amber"
          />
          <DualKPICard
            title="Avg Discount Depth"
            shopsyValue="15.4%"
            meeshoValue="23.7%"
          />
          <DualKPICard
            title="Listed SKUs"
            shopsyValue="498"
            meeshoValue="533"
          />
          <DualKPICard
            title="Availability Rate"
            shopsyValue="84.9%"
            meeshoValue="81.5%"
            shopsyHighlight="green"
          />
        </div>
      </section>

      {/* Section 2 -- Category Pressure Map */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">Category Intelligence</p>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Category Pressure Map</CardTitle>
            <p className="text-xs text-muted-foreground">
              Red = Shopsy worse &middot; Green = Shopsy better &middot; Amber = neutral
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-[220px]">Category</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Price Gap</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Promotion Gap</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Assortment Gap</th>
                </tr>
              </thead>
              <tbody>
                {pressureData.map((row) => (
                  <tr key={row.category} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-xs">{row.category}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", cellBg(row.priceGap.color))}>
                        {row.priceGap.value}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", cellBg(row.promoGap.color))}>
                        {row.promoGap.value}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", cellBg(row.assortmentGap.color))}>
                        {row.assortmentGap.value}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Section 3 -- Competitor Event Feed */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competitor Event Feed</CardTitle>
            <p className="text-xs text-muted-foreground">
              Recent competitive events sorted by severity
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No events loaded yet. Upload competitor_events data to populate.</p>
              ) : (
                events.map((evt, i) => (
                  <div
                    key={`${evt.date}-${evt.category}-${i}`}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                  >
                    {severityIcon(evt.severity)}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {severityBadge(evt.severity)}
                        <span className="text-xs font-medium">{evt.event_type}</span>
                        <span className="text-[10px] text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground">{evt.category}</span>
                        {evt.brand && (
                          <>
                            <span className="text-[10px] text-muted-foreground">&middot;</span>
                            <span className="text-xs text-muted-foreground">{evt.brand}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{evt.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">{evt.date}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
