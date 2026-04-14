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
  // ── Competitive Overview ──────────────────────────────────────────────────────
  {
    name: "SKU Availability Rate",
    formula: "SUM(availability_flag) / COUNT(rows) × 100",
    dataset: "availability_tracking",
    usedIn: ["Competitive Overview", "Availability Intelligence", "Local Market Intelligence"],
    module: "Competitive Overview",
  },
  {
    name: "Avg. Top-10 Presence",
    formula: "AVG per platform of [ SUM(top10_flag = 1) / COUNT(search observations) × 100 ] — averaged across all tracked platforms for Competitive Overview; per-platform in Search & Shelf Visibility",
    dataset: "search_rank_tracking",
    usedIn: ["Competitive Overview (cross-platform avg)", "Search & Shelf Visibility (per-platform)", "Local Market Intelligence"],
    module: "Competitive Overview",
  },
  {
    name: "Avg Price Gap vs Competitors",
    formula: "(Zepto sale_price − competitor avg sale_price) / competitor avg sale_price × 100",
    dataset: "price_tracking",
    usedIn: ["Competitive Overview", "Pricing & Promotion Intelligence"],
    module: "Competitive Overview",
  },
  {
    name: "% SKUs Under Promotion",
    formula: "SUM(promotion_flag = 1) / COUNT(rows) × 100",
    dataset: "price_tracking",
    usedIn: ["Competitive Overview", "Pricing & Promotion Intelligence", "Local Market Intelligence"],
    module: "Competitive Overview",
  },
  {
    name: "Avg Discount Depth",
    formula: "AVG(discount_percent) across rows where promotion_flag = 1",
    dataset: "price_tracking",
    usedIn: ["Competitive Overview", "Pricing & Promotion Intelligence", "Local Market Intelligence"],
    module: "Competitive Overview",
  },

  // ── Pricing & Promotion Intelligence ─────────────────────────────────────────
  {
    name: "Avg Sale Price",
    formula: "AVG(sale_price) across filtered rows",
    dataset: "price_tracking",
    usedIn: ["Pricing & Promotion Intelligence"],
    module: "Pricing & Promotion Intelligence",
  },
  {
    name: "Price Index",
    formula: "AVG(sale_price) / AVG(mrp) × 100 — measures effective price vs list price",
    dataset: "price_tracking",
    usedIn: ["Pricing & Promotion Intelligence", "Competitive Overview"],
    module: "Pricing & Promotion Intelligence",
  },
  {
    name: "Promotion Frequency",
    formula: "COUNT(distinct dates where promotion_flag = 1) / COUNT(distinct dates) × 100",
    dataset: "price_tracking",
    usedIn: ["Pricing & Promotion Intelligence"],
    module: "Pricing & Promotion Intelligence",
  },

  // ── Search & Shelf Visibility ─────────────────────────────────────────────────
  {
    name: "Avg Search Rank",
    formula: "AVG(search_rank) across all tracked keyword-platform observations",
    dataset: "search_rank_tracking",
    usedIn: ["Search & Shelf Visibility"],
    module: "Search & Shelf Visibility",
  },
  {
    name: "Top-3 Search Share",
    formula: "SUM(search_rank ≤ 3) / COUNT(observations) × 100",
    dataset: "search_rank_tracking",
    usedIn: ["Search & Shelf Visibility", "Competitive Overview"],
    module: "Search & Shelf Visibility",
  },
  {
    name: "Sponsored Share",
    formula: "SUM(sponsored_flag = 1) / COUNT(observations) × 100",
    dataset: "search_rank_tracking",
    usedIn: ["Search & Shelf Visibility"],
    module: "Search & Shelf Visibility",
  },
  {
    name: "Top-10 Presence (per platform)",
    formula: "SUM(top10_flag = 1) / COUNT(observations) × 100 — computed per platform for rank distribution and visibility charts",
    dataset: "search_rank_tracking",
    usedIn: ["Search & Shelf Visibility"],
    module: "Search & Shelf Visibility",
  },

  // ── Assortment Intelligence ───────────────────────────────────────────────────
  {
    name: "SKU Coverage",
    formula: "COUNT(distinct sku_id where listing_status = 1) per platform-category",
    dataset: "assortment_tracking",
    usedIn: ["Assortment Intelligence"],
    module: "Assortment Intelligence",
  },
  {
    name: "Listing Rate",
    formula: "COUNT(listing_status = 1) / COUNT(total SKU-platform combos) × 100",
    dataset: "assortment_tracking",
    usedIn: ["Assortment Intelligence"],
    module: "Assortment Intelligence",
  },
  {
    name: "Category Assortment Depth",
    formula: "COUNT(distinct sku_id listed) within a category per platform",
    dataset: "assortment_tracking",
    usedIn: ["Assortment Intelligence"],
    module: "Assortment Intelligence",
  },
  {
    name: "Platform Exclusive SKUs",
    formula: "COUNT(sku_id listed on exactly 1 platform) / COUNT(total SKUs) × 100",
    dataset: "assortment_tracking",
    usedIn: ["Assortment Intelligence"],
    module: "Assortment Intelligence",
  },

  // ── Availability Intelligence ─────────────────────────────────────────────────
  {
    name: "Must-Have SKU Availability",
    formula: "AVG(availability_flag) × 100 — filtered to must_have_flag = 1 rows only",
    dataset: "availability_tracking",
    usedIn: ["Availability Intelligence"],
    module: "Availability Intelligence",
  },
  {
    name: "Stockout Rate",
    formula: "SUM(availability_flag = 0) / COUNT(rows) × 100",
    dataset: "availability_tracking",
    usedIn: ["Availability Intelligence", "Competitive Overview"],
    module: "Availability Intelligence",
  },
  {
    name: "Category Availability Health",
    formula: "AVG(availability_flag) × 100 grouped by category — shows weakest category",
    dataset: "availability_tracking",
    usedIn: ["Availability Intelligence"],
    module: "Availability Intelligence",
  },

  // ── Local Market Intelligence ─────────────────────────────────────────────────
  {
    name: "Market Competition Index",
    formula: "0.35 × % SKUs Under Promotion + 0.25 × Avg Discount Depth + 0.20 × Top-10 Presence + 0.20 × SKU Availability Rate — computed independently per city",
    dataset: "price_tracking, availability_tracking, search_rank_tracking",
    usedIn: ["Local Market Intelligence"],
    module: "Local Market Intelligence",
  },
  {
    name: "Hyperlocal Price Variance",
    formula: "STDDEV(AVG(sale_price) grouped by pincode) within a city — or by SKU×platform when no pincode data exists",
    dataset: "price_tracking",
    usedIn: ["Local Market Intelligence"],
    module: "Local Market Intelligence",
  },
];

const MODULE_COLORS: Record<string, string> = {
  "Competitive Overview":            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Pricing & Promotion Intelligence":"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Search & Shelf Visibility":       "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Assortment Intelligence":         "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Availability Intelligence":       "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Local Market Intelligence":       "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
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
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Formula</th>
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
        All formulas operate on filtered subsets respecting the global City, Platform, Category, and Pincode selectors unless stated otherwise.
      </p>
    </div>
  );
};

export default AnalyticsTaxonomy;
