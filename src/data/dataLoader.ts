/**
 * dataLoader.ts — Shopsy vs Meesho Category-First Schema v2.0
 *
 * PRIMARY ENTITY: category × subcategory × platform × date
 * No shared SKU registry. All comparisons are category/subcategory-level aggregates.
 *
 * Dataset files (public/data/*.json.gz):
 *   category_master       — taxonomy reference (one row per category × subcategory)
 *   category_pricing      — avg price, discount, promo rate per cat×subcat×platform×date
 *   category_availability — availability rate per cat×subcat×platform×date
 *   category_assortment   — listing depth score per cat×subcat×platform×date
 *   category_search       — search visibility, rank, sponsored share per cat×subcat×platform×date
 *   genz_signals          — Gen Z traction score per cat×subcat×platform×date
 *   demand_signals        — demand momentum, stockout risk per cat×subcat×platform×date
 *   promo_calendar        — active promotions per cat×subcat×platform×date (timeline view)
 *   promotion_roi         — ROI score, recommended budget allocation per cat×subcat
 *   competitor_events     — intelligence event feed
 *   platform_summary      — one-row-per-platform executive KPI snapshot
 *   category_summary      — one-row-per-category×platform (for Category Pressure Matrix)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type GenZSignalLevel = "very_high" | "high" | "moderate" | "low";
export type Platform = "Shopsy" | "Meesho";
export type CompetitivePressure = "Critical" | "High" | "Medium" | "Low" | "N/A";
export type ActionFlag = "Act Now" | "Monitor" | "Hold";
export type AssortmentPriority = "High" | "Medium" | "Low";
export type TrendLabel = "Trending" | "Rising" | "Emerging" | "Watching";
export type BudgetPriority = "P1 — Act Now" | "P2 — Consider" | "P3 — Monitor";

// ── category_master ───────────────────────────────────────────────────────────
export interface CategoryMaster {
  category: string;
  subcategory: string;
  genz_signal: GenZSignalLevel;
  mrp_range_low: number;
  mrp_range_high: number;
  category_gmv_weight: number;
  subcategory_gmv_weight: number;
  meesho_depth_score: number;
  shopsy_depth_score: number;
  keyword_count: number;
}

// ── category_pricing ─────────────────────────────────────────────────────────
export interface CategoryPricing {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  avg_mrp: number;
  avg_sale_price: number;
  avg_discount_pct: number;
  promotion_flag: number;          // 0 | 1
  promo_type: string;              // "Flash Sale" | "Coupon" | "Bundle" | "Flat Discount" | "None"
  competitor_price: number;
  price_gap_pct: number;           // positive = this platform is more expensive than competitor
  campaign_active: number;         // 0 | 1
  genz_signal: GenZSignalLevel;
}

// ── category_availability ────────────────────────────────────────────────────
export interface CategoryAvailability {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  availability_rate: number;       // 0.0 – 1.0
  stockout_rate: number;           // 1 - availability_rate
  genz_signal: GenZSignalLevel;
}

// ── category_assortment ──────────────────────────────────────────────────────
export interface CategoryAssortment {
  date: string;
  category: string;
  subcategory: string;
  meesho_depth_score: number;      // 0.0 – 1.0 (relative listing depth index)
  shopsy_depth_score: number;
  depth_ratio: number;             // shopsy / meesho  (<0.8 = Shopsy materially under-assorted)
  depth_gap: number;               // meesho - shopsy  (positive = Meesho leads)
  genz_signal: GenZSignalLevel;
  assortment_priority: AssortmentPriority;
}

// ── category_search ──────────────────────────────────────────────────────────
export interface CategorySearch {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  visibility_rate: number;         // 0.0 – 1.0 share of search slots
  avg_rank: number;                // lower = better
  top3_presence_rate: number;      // 0.0 – 1.0
  sponsored_share: number;         // 0.0 – 1.0
  keyword_count: number;
  genz_signal: GenZSignalLevel;
}

// ── genz_signals ─────────────────────────────────────────────────────────────
export interface GenZSignal {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  genz_traction_score: number;     // 0 – 99
  genz_signal_level: GenZSignalLevel;
  rank_movement_7d: number;        // positive = improving rank
  trend_label: TrendLabel;
}

// ── demand_signals ───────────────────────────────────────────────────────────
export interface DemandSignal {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  demand_score: number;            // 0 – 99
  stockout_risk: number;           // 0.0 – 1.0
  lost_demand_index: number;       // demand_score × stockout_risk
  demand_velocity: number;         // rate of change (positive = accelerating)
  genz_signal: GenZSignalLevel;
  action_flag: ActionFlag;
}

// ── promo_calendar ───────────────────────────────────────────────────────────
export interface PromoCalendar {
  date: string;
  category: string;
  subcategory: string;
  platform: Platform;
  promo_active: number;            // 0 | 1
  promo_type: string;
  discount_depth: number;          // percentage
  is_campaign_event: number;       // 0 | 1 — seeded campaign window
  genz_signal: GenZSignalLevel;
}

// ── promotion_roi ─────────────────────────────────────────────────────────────
export interface PromotionROI {
  category: string;
  subcategory: string;
  genz_signal: GenZSignalLevel;
  avg_price_gap_pct: number;
  meesho_promo_rate: number;
  shopsy_availability: number;
  assortment_depth_gap: number;    // meesho_depth - shopsy_depth (positive = Meesho leads)
  genz_traction_score: number;
  promotion_roi_score: number;     // 0 – 100 composite
  recommended_promo_type: string;
  recommended_discount: number;
  avg_subcategory_price_inr: number;
  estimated_monthly_orders: number;
  estimated_promo_cost_cr: number;  // real monthly promo cost in Rs Crore (orders × price × disc × 0.30 coverage)
  orders_at_risk: number;
  orders_at_risk_label: string;
  budget_priority: BudgetPriority;
}

// ── competitor_events ─────────────────────────────────────────────────────────
export interface CompetitorEvent {
  date: string;
  platform: Platform;
  category: string;
  subcategory: string;
  event_type: string;              // "Price Gap Alert" | "Promo Surge" | "Assortment Gap" | "Availability Risk" | "Competitive Strength"
  severity: string;                // "High" | "Medium" | "Info"
  description: string;
}

// ── platform_summary ──────────────────────────────────────────────────────────
export interface PlatformSummary {
  platform: Platform;
  availability_rate: number;       // percentage (e.g. 85.4)
  search_visibility_pct: number;
  active_promo_rate: number;
  avg_discount_depth: number;
  avg_listing_depth_score: number;
  avg_genz_traction: number;
  avg_price_gap_pct: number;
  competitiveness_score: number;   // 0 – 100
  // Real-world anchor numbers embedded for demo credibility
  ref_annual_orders_bn: number | null;
  ref_avg_order_value_inr: number | null;
  ref_total_users_mn: number;
  ref_tier2_order_share_pct: number;
}

// ── category_summary ──────────────────────────────────────────────────────────
// One row per category × platform — powers Category Pressure Matrix
export interface CategorySummary {
  category: string;
  platform: Platform;
  avg_price_gap_pct: number;
  avg_promo_rate: number;
  promo_intensity_gap: number;     // Meesho promo rate − Shopsy promo rate (positive = Meesho promoting more)
  avg_availability_rate: number;
  avg_search_visibility: number;
  avg_genz_score: number;
  shopsy_depth_score: number;
  meesho_depth_score: number;
  category_gmv_weight: number;
  competitive_pressure: CompetitivePressure;
  unanswered_campaign_days: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATASET STORE
// Module-level mutable store. DataContext hydrates these arrays at runtime.
// Pages read from here via the accessor functions below — never from raw JSON.
// ─────────────────────────────────────────────────────────────────────────────

export const datasets: {
  categoryMaster: CategoryMaster[];
  categoryPricing: CategoryPricing[];
  categoryAvailability: CategoryAvailability[];
  categoryAssortment: CategoryAssortment[];
  categorySearch: CategorySearch[];
  genzSignals: GenZSignal[];
  demandSignals: DemandSignal[];
  promoCalendar: PromoCalendar[];
  promotionROI: PromotionROI[];
  competitorEvents: CompetitorEvent[];
  platformSummary: PlatformSummary[];
  categorySummary: CategorySummary[];
} = {
  categoryMaster: [],
  categoryPricing: [],
  categoryAvailability: [],
  categoryAssortment: [],
  categorySearch: [],
  genzSignals: [],
  demandSignals: [],
  promoCalendar: [],
  promotionROI: [],
  competitorEvents: [],
  platformSummary: [],
  categorySummary: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalFilters {
  platform: Platform | "All Platforms";
  category: string;                // "All Categories" or a specific category string
  subcategory: string;             // "All Subcategories" or a specific subcategory string
  genzSignal: GenZSignalLevel | "All";
}

export const DEFAULT_FILTERS: GlobalFilters = {
  platform: "All Platforms",
  category: "All Categories",
  subcategory: "All Subcategories",
  genzSignal: "All",
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSOR FUNCTIONS
// All pages use these. Never read datasets.* directly in component files.
// ─────────────────────────────────────────────────────────────────────────────

/** All unique top-level categories from taxonomy */
export function getUniqueCategories(): string[] {
  return [...new Set(datasets.categoryMaster.map((r) => r.category))].sort();
}

/** All unique subcategories, optionally filtered by category */
export function getUniqueSubcategories(category?: string): string[] {
  const rows = category
    ? datasets.categoryMaster.filter((r) => r.category === category)
    : datasets.categoryMaster;
  return [...new Set(rows.map((r) => r.subcategory))].sort();
}

/** Latest date present in the pricing dataset */
export function getLatestDate(): string {
  if (!datasets.categoryPricing.length) return "";
  return datasets.categoryPricing.reduce((max, r) => (r.date > max ? r.date : max), "");
}

/** All distinct dates in the pricing dataset, sorted ascending */
export function getAllDates(): string[] {
  return [...new Set(datasets.categoryPricing.map((r) => r.date))].sort();
}

// ── Category Pressure Matrix ──────────────────────────────────────────────────

/** Shopsy rows only from category_summary — used in Category Pressure Matrix */
export function getCategoryPressureMatrix(): CategorySummary[] {
  return datasets.categorySummary.filter((r) => r.platform === "Shopsy");
}

// ── Pricing ───────────────────────────────────────────────────────────────────

/** Latest-date pricing for a given platform (or both) */
export function getPricingLatest(platform?: Platform): CategoryPricing[] {
  const latest = getLatestDate();
  return datasets.categoryPricing.filter(
    (r) => r.date === latest && (platform ? r.platform === platform : true)
  );
}

/** Pricing time series for a specific category × subcategory × platform */
export function getPricingTrend(
  category: string,
  subcategory: string,
  platform: Platform
): CategoryPricing[] {
  return datasets.categoryPricing
    .filter((r) => r.category === category && r.subcategory === subcategory && r.platform === platform)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Subcategory-level price index summary for latest date — one row per cat×subcat */
export function getSubcategoryPriceIndex(): Array<{
  category: string;
  subcategory: string;
  genz_signal: GenZSignalLevel;
  shopsy_price_gap_pct: number;    // Shopsy vs Meesho — positive = Shopsy more expensive
  meesho_promo_rate: number;
  shopsy_promo_rate: number;
  promo_intensity_gap: number;     // Meesho − Shopsy promo rate
  campaign_active_meesho: boolean;
}> {
  const latest = getLatestDate();
  const pricing = datasets.categoryPricing.filter((r) => r.date === latest);
  const master = datasets.categoryMaster;

  return master.map((m) => {
    const shopsy = pricing.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Shopsy");
    const meesho = pricing.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Meesho");

    const shopsy_gap = shopsy?.price_gap_pct ?? 0;
    const meesho_promo = meesho?.promotion_flag ?? 0;
    const shopsy_promo = shopsy?.promotion_flag ?? 0;

    return {
      category: m.category,
      subcategory: m.subcategory,
      genz_signal: m.genz_signal,
      shopsy_price_gap_pct: shopsy_gap,
      meesho_promo_rate: meesho_promo,
      shopsy_promo_rate: shopsy_promo,
      promo_intensity_gap: meesho_promo - shopsy_promo,
      campaign_active_meesho: (meesho?.campaign_active ?? 0) === 1,
    };
  });
}

// ── Availability ──────────────────────────────────────────────────────────────

/** Latest-date availability for a given platform (or both) */
export function getAvailabilityLatest(platform?: Platform): CategoryAvailability[] {
  const latest = getLatestDate();
  return datasets.categoryAvailability.filter(
    (r) => r.date === latest && (platform ? r.platform === platform : true)
  );
}

/** Availability trend for a specific category × subcategory × platform */
export function getAvailabilityTrend(
  category: string,
  subcategory: string,
  platform: Platform
): CategoryAvailability[] {
  return datasets.categoryAvailability
    .filter((r) => r.category === category && r.subcategory === subcategory && r.platform === platform)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 7-day availability trend direction: returns +1 (improving), -1 (declining), 0 (flat) */
export function getAvailabilityTrendDirection(
  category: string,
  subcategory: string,
  platform: Platform
): number {
  const trend = getAvailabilityTrend(category, subcategory, platform);
  if (trend.length < 2) return 0;
  const first = trend[0].availability_rate;
  const last = trend[trend.length - 1].availability_rate;
  const delta = last - first;
  if (delta > 0.01) return 1;
  if (delta < -0.01) return -1;
  return 0;
}

// ── Assortment ────────────────────────────────────────────────────────────────

/** Latest-date assortment for all subcategories, sorted by Gen Z signal then depth gap */
export function getAssortmentLatest(): CategoryAssortment[] {
  const latest = getLatestDate();
  const SIGNAL_ORDER: Record<GenZSignalLevel, number> = { very_high: 0, high: 1, moderate: 2, low: 3 };
  return datasets.categoryAssortment
    .filter((r) => r.date === latest)
    .sort((a, b) => {
      const sigDiff = SIGNAL_ORDER[a.genz_signal] - SIGNAL_ORDER[b.genz_signal];
      return sigDiff !== 0 ? sigDiff : b.depth_gap - a.depth_gap;
    });
}

// ── Search / Shelf Visibility ─────────────────────────────────────────────────

/** Latest-date search data for a given platform (or both) */
export function getSearchLatest(platform?: Platform): CategorySearch[] {
  const latest = getLatestDate();
  return datasets.categorySearch.filter(
    (r) => r.date === latest && (platform ? r.platform === platform : true)
  );
}

// ── Gen Z Signals ─────────────────────────────────────────────────────────────

/** Latest-date Gen Z scores for both platforms, sorted by score descending */
export function getGenZLeaderboard(): GenZSignal[] {
  const latest = getLatestDate();
  return datasets.genzSignals
    .filter((r) => r.date === latest)
    .sort((a, b) => b.genz_traction_score - a.genz_traction_score);
}

/**
 * Gen Z platform split per subcategory — shows which platform owns the Gen Z signal.
 * Returns one row per subcategory with both platform scores side by side.
 */
export function getGenZPlatformSplit(): Array<{
  category: string;
  subcategory: string;
  genz_signal_level: GenZSignalLevel;
  shopsy_score: number;
  meesho_score: number;
  leading_platform: Platform;
  score_gap: number;
}> {
  const latest = getLatestDate();
  const rows = datasets.genzSignals.filter((r) => r.date === latest);
  const master = datasets.categoryMaster;

  return master.map((m) => {
    const shopsy = rows.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Shopsy");
    const meesho = rows.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Meesho");
    const ss = shopsy?.genz_traction_score ?? 0;
    const ms = meesho?.genz_traction_score ?? 0;
    return {
      category: m.category,
      subcategory: m.subcategory,
      genz_signal_level: m.genz_signal,
      shopsy_score: ss,
      meesho_score: ms,
      leading_platform: (ss >= ms ? "Shopsy" : "Meesho") as Platform,
      score_gap: Math.abs(ss - ms),
    };
  }).sort((a, b) => {
    const SIGNAL_ORDER: Record<GenZSignalLevel, number> = { very_high: 0, high: 1, moderate: 2, low: 3 };
    return SIGNAL_ORDER[a.genz_signal_level] - SIGNAL_ORDER[b.genz_signal_level];
  });
}

// ── Demand Signals ────────────────────────────────────────────────────────────

/** Latest-date demand for a given platform (or both) */
export function getDemandLatest(platform?: Platform): DemandSignal[] {
  const latest = getLatestDate();
  return datasets.demandSignals.filter(
    (r) => r.date === latest && (platform ? r.platform === platform : true)
  );
}

/** Demand trend for a specific category × subcategory × platform */
export function getDemandTrend(
  category: string,
  subcategory: string,
  platform: Platform
): DemandSignal[] {
  return datasets.demandSignals
    .filter((r) => r.category === category && r.subcategory === subcategory && r.platform === platform)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Promo Calendar ────────────────────────────────────────────────────────────

/** All promo calendar rows for the full date window (for 14-day timeline view) */
export function getPromoCalendarAll(): PromoCalendar[] {
  return datasets.promoCalendar.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Unanswered promotion detector: subcategories where Meesho has a campaign active
 * but Shopsy does not, on a given date.
 */
export function getUnansweredPromos(date?: string): Array<{
  category: string;
  subcategory: string;
  genz_signal: GenZSignalLevel;
  meesho_discount_depth: number;
}> {
  const d = date ?? getLatestDate();
  const rows = datasets.promoCalendar.filter((r) => r.date === d);
  const master = datasets.categoryMaster;

  return master.reduce<Array<{ category: string; subcategory: string; genz_signal: GenZSignalLevel; meesho_discount_depth: number }>>(
    (acc, m) => {
      const meesho = rows.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Meesho");
      const shopsy = rows.find((r) => r.category === m.category && r.subcategory === m.subcategory && r.platform === "Shopsy");
      if (meesho?.promo_active === 1 && (shopsy?.promo_active ?? 0) === 0) {
        acc.push({
          category: m.category,
          subcategory: m.subcategory,
          genz_signal: m.genz_signal,
          meesho_discount_depth: meesho.discount_depth,
        });
      }
      return acc;
    },
    []
  );
}

// ── Promotion ROI / Budget Optimizer ─────────────────────────────────────────

/** All ROI rows sorted by roi score descending */
export function getPromotionROI(): PromotionROI[] {
  return [...datasets.promotionROI].sort((a, b) => b.promotion_roi_score - a.promotion_roi_score);
}

/** P1 (Act Now) opportunities only */
export function getTopBudgetOpportunities(): PromotionROI[] {
  return getPromotionROI().filter((r) => r.budget_priority === "P1 — Act Now");
}

// ── Competitor Events ─────────────────────────────────────────────────────────

export function getEvents(severity?: string): CompetitorEvent[] {
  const events = [...datasets.competitorEvents].sort((a, b) => b.date.localeCompare(a.date));
  return severity ? events.filter((e) => e.severity === severity) : events;
}

// ── Platform Summary ──────────────────────────────────────────────────────────

export function getPlatformSummary(): PlatformSummary[] {
  return datasets.platformSummary;
}

export function getPlatformSummaryFor(platform: Platform): PlatformSummary | undefined {
  return datasets.platformSummary.find((r) => r.platform === platform);
}
