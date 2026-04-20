// @ts-nocheck
import { BookOpen, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


interface KPI {
  name: string;
  formula: string;
  dataset: string;
  usedIn: string[];
  module: string;
}

const KPIS: KPI[] = [

  // ── Promotion Budget Optimizer ────────────────────────────────────────────────
  {
    name: "Promotion ROI Score",
    formula: "How strongly we recommend promoting this subcategory now. Combines four signals: how much Shopsy is priced above Meesho (30%), how aggressively Meesho is currently promoting (25%), Gen Z demand strength (25%), and Shopsy's ability to absorb traffic given current stock levels (20%). Higher = stronger case to act.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Priority Queue", "Promotion Budget Optimizer — Scenario Comparison"],
    module: "Promotion Budget Optimizer",
  },
  {
    name: "Recommended Promo Type",
    formula: "Flash Sale when Shopsy price gap vs Meesho exceeds 15% — close the gap aggressively. Coupon when gap is 8–15%. Flat Discount when gap is 3–8%. Bundle when Shopsy is already price-competitive — hold price, add value.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Priority Queue", "Promotion Budget Optimizer — Scenario Comparison"],
    module: "Promotion Budget Optimizer",
  },
  {
    name: "Recommended Discount %",
    formula: "Discount depth matched to promo type: Flash Sale 14–20%, Coupon 8–14%, Flat Discount 5–9%, Bundle 5–10%.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Priority Queue"],
    module: "Promotion Budget Optimizer",
  },
  {
    name: "Budget Priority",
    formula: "P1 — Act Now: ROI Score above 70. P2 — Consider: ROI Score 50–70. P3 — Monitor: ROI Score below 50.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Priority Queue", "Promotion Budget Optimizer — Scenario Comparison"],
    module: "Promotion Budget Optimizer",
  },
  {
    name: "Avg ROI Score (Scenario)",
    formula: "Average Promotion ROI Score across the subcategories selected within a given budget scenario. Higher means each spend decision has a stronger competitive justification.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Scenario Comparison"],
    module: "Promotion Budget Optimizer",
  },
  {
    name: "Promo Opportunity by Category",
    formula: "Average Promotion ROI Score across all subcategories within a category. Higher = more subcategories in that category with a strong competitive case to promote now.",
    dataset: "promotion_roi",
    usedIn: ["Promotion Budget Optimizer — Category Chart"],
    module: "Promotion Budget Optimizer",
  },

  // ── Demand & Availability ─────────────────────────────────────────────────────
  {
    name: "Demand Pressure Score",
    formula: "How intensely consumers are seeking products in a subcategory right now. Driven by Gen Z engagement level, stockout patterns (stockouts proxy unmet demand), and demand velocity. Above 65 = strong promotional candidate. Above 75 = high urgency to either promote (if stock is healthy) or replenish (if OOS is elevated).",
    dataset: "demand_signals",
    usedIn: ["Demand & Availability — KPI", "Demand & Availability — Subcategory Table", "Demand & Availability — Action Queue"],
    module: "Demand & Availability",
  },
  {
    name: "Stockout Risk",
    formula: "1 − availability_rate. The share of listings in a subcategory that are out of stock on a given platform and date. Above 15% = elevated risk; above 20% = critical.",
    dataset: "category_availability",
    usedIn: ["Demand & Availability — Subcategory Table", "Demand & Availability — Stockout by Category Chart"],
    module: "Demand & Availability",
  },
  {
    name: "Demand Exceeds Supply",
    formula: "Count of subcategories where Demand Pressure Score > 55 AND Stockout Risk > 15%. These are the most urgent replenishment candidates — strong demand is present but Shopsy cannot fulfil it.",
    dataset: "demand_signals, category_availability",
    usedIn: ["Demand & Availability — KPI"],
    module: "Demand & Availability",
  },
  {
    name: "Missed Demand Score",
    formula: "Demand Pressure Score × Stockout Risk per subcategory. Directional signal for unmet demand — higher means more consumers are likely not finding stock. Use for prioritisation only; not a revenue figure.",
    dataset: "demand_signals",
    usedIn: ["Demand & Availability — Subcategory Table"],
    module: "Demand & Availability",
  },
  {
    name: "Action Flag",
    formula: "Act Now: Demand Score > 75 AND Stockout Risk > 15% — supply intervention needed before or alongside promotion. Monitor: Demand Score > 55. Hold: Demand Score < 40 — conserve budget.",
    dataset: "demand_signals",
    usedIn: ["Demand & Availability — Action Queue", "Demand & Availability — Subcategory Table"],
    module: "Demand & Availability",
  },
  {
    name: "Availability Trend Direction",
    formula: "14-day slope of availability_rate for a subcategory × platform combination. Upward = availability deteriorating (more OOS over time). Downward = availability improving.",
    dataset: "category_availability",
    usedIn: ["Demand & Availability — Subcategory Table"],
    module: "Demand & Availability",
  },

  // ── Gen Z Demand Signals ──────────────────────────────────────────────────────
  {
    name: "Gen Z Traction Score",
    formula: "How strongly Gen Z shoppers are engaging with a subcategory on a given platform. Built from the subcategory's inherent Gen Z signal level (e.g. Very High for Co-ord Sets, Gaming), platform advantages (Meesho leads fashion Gen Z; Shopsy leads electronics Gen Z), and a 14-day upward trend component. Trending ≥ 80, Rising ≥ 65, Emerging ≥ 50, Watching < 50.",
    dataset: "genz_signals",
    usedIn: ["Gen Z Demand Signals — Leaderboard", "Gen Z Demand Signals — Category Chart", "Promotion Budget Optimizer"],
    module: "Gen Z Demand Signals",
  },
  {
    name: "Gen Z Signal Level",
    formula: "Taxonomy classification per subcategory: Very High (Co-ord Sets, Oversized T-shirts, Skincare Serums, Audio, Gaming), High (Western Dresses, Graphic Tees, Artificial Jewellery, Wireless Earbuds), Moderate, or Low. Set at data generation time based on category Gen Z affinity.",
    dataset: "category_master",
    usedIn: ["Gen Z Demand Signals — Leaderboard", "Gen Z Demand Signals — Strategic Response", "Promotion Budget Optimizer", "Demand & Availability"],
    module: "Gen Z Demand Signals",
  },
  {
    name: "Platform Gen Z Leader",
    formula: "The platform (Shopsy or Meesho) with the higher Gen Z Traction Score for a given subcategory on the latest date. Score Gap = absolute difference between the two platform scores.",
    dataset: "genz_signals",
    usedIn: ["Gen Z Demand Signals — Leaderboard"],
    module: "Gen Z Demand Signals",
  },
  {
    name: "Response Gap",
    formula: "High or Very High Gen Z subcategories where Meesho's traction score exceeds Shopsy's by more than 3 points. Combined with Shopsy's price premium vs Meesho and whether Meesho has an active campaign — identifies the highest-priority subcategories for promotional or assortment response.",
    dataset: "genz_signals, category_pricing",
    usedIn: ["Gen Z Demand Signals — Strategic Response Panel"],
    module: "Gen Z Demand Signals",
  },
  {
    name: "Gen Z Search Visibility",
    formula: "Share of top-10 search slots (%) that a platform occupies in a given subcategory. Calculated from a 50/50 base modified by platform-category search bias factors. Lower visibility in a high Gen Z subcategory = missed demand that cannot be captured through organic search.",
    dataset: "category_search",
    usedIn: ["Gen Z Demand Signals — Search Visibility Chart"],
    module: "Gen Z Demand Signals",
  },

  // ── Competitive Overview ──────────────────────────────────────────────────────
  {
    name: "Price Gap (Platform vs Competitor)",
    formula: "((Shopsy avg sale price − Meesho avg sale price) / Meesho avg sale price) × 100. Positive = Shopsy is more expensive. Computed per subcategory and aggregated to platform level.",
    dataset: "category_pricing",
    usedIn: ["Competitive Overview — Platform KPIs", "Pricing & Promotions — Subcategory Table"],
    module: "Competitive Overview",
  },
  {
    name: "Promo Rate",
    formula: "Share of subcategory × date observations where a promotion was active. Meesho's base promo rate is structurally higher due to its reseller model (deeper and more frequent discounts).",
    dataset: "category_pricing, promo_calendar",
    usedIn: ["Competitive Overview — Platform KPIs", "Pricing & Promotions"],
    module: "Competitive Overview",
  },
  {
    name: "Competitive Pressure Rating",
    formula: "Critical: Shopsy price gap > 15% AND Meesho promo intensity gap > 10pp. High: price gap > 8% OR promo gap > 8pp. Medium: price gap > 3% OR promo gap > 4pp. Low otherwise. Used to colour-code the Category Pressure Matrix.",
    dataset: "category_summary",
    usedIn: ["Competitive Overview — Category Pressure Matrix"],
    module: "Competitive Overview",
  },
  {
    name: "Gen Z Traction (Platform Avg)",
    formula: "Average Gen Z Traction Score across all subcategories for a platform on the latest date. Used for side-by-side platform comparison only — not a substitute for subcategory-level analysis.",
    dataset: "genz_signals",
    usedIn: ["Competitive Overview — Platform KPIs"],
    module: "Competitive Overview",
  },
  {
    name: "Availability Rate (Platform)",
    formula: "Average in-stock rate across all monitored subcategories for a platform on the latest date. 100% = all listings in stock.",
    dataset: "category_availability",
    usedIn: ["Competitive Overview — Platform KPIs"],
    module: "Competitive Overview",
  },

  // ── Pricing & Promotions ──────────────────────────────────────────────────────
  {
    name: "Subcategory Price Gap",
    formula: "((Shopsy avg sale price − Meesho avg sale price) / Meesho avg sale price) × 100 for a specific subcategory on the latest date. Positive = Shopsy overpriced vs Meesho. Pre-computed at generation time — the frontend never joins platform rows.",
    dataset: "category_pricing",
    usedIn: ["Pricing & Promotions — Subcategory Table", "Promotion Budget Optimizer"],
    module: "Pricing & Promotions",
  },
  {
    name: "Promo Intensity Gap",
    formula: "Meesho avg promo rate − Shopsy avg promo rate across the full date window for a subcategory. Positive = Meesho is out-promoting Shopsy. A large positive number in a high Gen Z category is the most actionable alert on this page.",
    dataset: "category_summary",
    usedIn: ["Pricing & Promotions — Subcategory Table", "Competitive Overview"],
    module: "Pricing & Promotions",
  },
  {
    name: "Unanswered Promotion",
    formula: "Subcategories where Meesho has an active promotion on the current date and Shopsy does not. Identified via is_campaign_event flag — distinguishes deliberate Meesho campaigns from organic promotions.",
    dataset: "promo_calendar",
    usedIn: ["Pricing & Promotions — KPI", "Promotion Budget Optimizer — Promo Calendar"],
    module: "Pricing & Promotions",
  },
  {
    name: "Avg Discount Depth",
    formula: "Average discount percentage across all active promotions for a platform × subcategory × date. Meesho structurally discounts deeper (10–38%) than Shopsy (8–28%) due to its reseller model.",
    dataset: "category_pricing",
    usedIn: ["Pricing & Promotions — Subcategory Table"],
    module: "Pricing & Promotions",
  },

  // ── Assortment Intelligence ───────────────────────────────────────────────────
  {
    name: "Catalogue Depth (% of Meesho)",
    formula: "Shopsy depth score ÷ Meesho depth score × 100. Represents how broad Shopsy's listing catalogue is relative to Meesho's in a given subcategory. 100% = parity. Below 70% = Shopsy is materially under-assorted and likely losing discovery to Meesho.",
    dataset: "category_assortment",
    usedIn: ["Assortment Intelligence — Subcategory Table", "Assortment Intelligence — Depth Ratio Chart"],
    module: "Assortment Intelligence",
  },
  {
    name: "Depth Gap",
    formula: "Meesho depth score − Shopsy depth score. Positive = Meesho has a broader catalogue. Always from Shopsy's perspective — a positive number is a gap Shopsy should close.",
    dataset: "category_assortment",
    usedIn: ["Assortment Intelligence — Subcategory Table"],
    module: "Assortment Intelligence",
  },
  {
    name: "Assortment Priority",
    formula: "High: Depth Gap > 0.25 AND Gen Z signal is Very High or High — a listing gap in a category consumers are actively searching. Medium: Depth Gap > 0.15. Low: otherwise.",
    dataset: "category_assortment",
    usedIn: ["Assortment Intelligence — Subcategory Table"],
    module: "Assortment Intelligence",
  },
  {
    name: "Critical Depth Gap",
    formula: "Shopsy catalogue depth is below 70% of Meesho's (depth ratio < 0.70). These subcategories have a structural listing disadvantage — consumers searching on-platform will find far more options on Meesho.",
    dataset: "category_assortment",
    usedIn: ["Assortment Intelligence — KPI"],
    module: "Assortment Intelligence",
  },
];

const MODULE_COLORS: Record<string, string> = {
  "Promotion Budget Optimizer": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Demand & Availability":      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Gen Z Demand Signals":       "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Competitive Overview":       "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Pricing & Promotions":       "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Assortment Intelligence":    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

const ALL_MODULES = Object.keys(MODULE_COLORS);

const AnalyticsTaxonomy = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const filtered = KPIS.filter((k) => {
    const q = query.toLowerCase();
    const matchesSearch =
      !q ||
      k.name.toLowerCase().includes(q) ||
      k.formula.toLowerCase().includes(q) ||
      k.dataset.toLowerCase().includes(q) ||
      k.usedIn.some((u) => u.toLowerCase().includes(q));
    const matchesModule = !activeModule || k.module === activeModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary shrink-0">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Taxonomy</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Canonical definitions for every KPI across all dashboard modules — formulas, data sources, and usage context.
          </p>
        </div>
      </div>

      {/* Search + Module filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search KPIs, formulas, datasets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveModule(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              !activeModule
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70"
            }`}
          >
            All
          </button>
          {ALL_MODULES.map((m) => (
            <button
              key={m}
              onClick={() => setActiveModule(activeModule === m ? null : m)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeModule === m
                  ? `${MODULE_COLORS[m]} border-current`
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {KPIS.length} KPIs
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-48">KPI Name</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Definition</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-56">Dataset Source</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-64">Where Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((kpi, i) => (
              <tr key={i} className="bg-card hover:bg-muted/30 transition-colors">
                {/* KPI Name */}
                <td className="px-4 py-3.5 align-top">
                  <div className="font-semibold text-foreground leading-snug">{kpi.name}</div>
                  <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${MODULE_COLORS[kpi.module]}`}>
                    {kpi.module}
                  </div>
                </td>

                {/* Formula */}
                <td className="px-4 py-3.5 align-top">
                  <code className="text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                    {kpi.formula}
                  </code>
                </td>

                {/* Dataset */}
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-wrap gap-1">
                    {kpi.dataset.split(",").map((d) => (
                      <Badge
                        key={d}
                        variant="secondary"
                        className="text-[10px] font-mono px-1.5 py-0.5 h-auto"
                      >
                        {d.trim()}
                      </Badge>
                    ))}
                  </div>
                </td>

                {/* Where Used */}
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-col gap-1">
                    {kpi.usedIn.map((page) => (
                      <span key={page} className="text-xs text-muted-foreground leading-snug">
                        • {page}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No KPIs match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground pb-4">
        All KPIs are pre-computed at data generation time. The frontend visualises values — it never re-derives them. Definitions reflect the Shopsy vs Meesho synthetic dataset (Apr 2026).
      </p>
    </div>
  );
};

export default AnalyticsTaxonomy;
