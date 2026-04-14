// All datasets hydrated at runtime from /data/*.json.gz via DataContext

export interface SKUMaster {
  sku_id: string;
  normalized_name: string;
  brand: string;
  brand_affinity: "national" | "meesho" | "shopsy";
  category: string;
  product_type: string;
  base_mrp: number;
  must_have_flag: number;
  shopsy_sku_id: string;
  shopsy_name: string;
  meesho_sku_id: string;
  meesho_name: string;
}

export interface AssortmentRecord {
  sku_id: string;
  platform: string;
  listing_status: number;
  category: string;
  brand: string;
  brand_affinity: string;
  must_have_flag: number;
  platform_sku_id: string;
  display_name: string;
}

export interface PriceRecord {
  date: string;
  sku_id: string;
  platform: string;
  category: string;
  brand: string;
  mrp: number;
  sale_price: number;
  discount_percent: number;
  promotion_flag: number;
  promotion_type: string;
  competitor_price: number;
  price_gap_pct: number;
  must_have_flag: number;
}

export interface AvailabilityRecord {
  date: string;
  sku_id: string;
  platform: string;
  category: string;
  brand: string;
  availability_flag: number;
  stockout_flag: number;
  must_have_flag: number;
}

export interface SearchRankRecord {
  date: string;
  keyword: string;
  keyword_genz_flag: number;
  platform: string;
  sku_id: string;
  category: string;
  search_rank: number;
  sponsored_flag: number;
  top3_flag: number;
  top10_flag: number;
  top20_flag: number;
}

export interface ReviewRawRecord {
  review_id: string;
  date: string;
  platform: string;
  sku_id: string;
  category: string;
  brand: string;
  rating: number;
  sentiment: string;
  topic: string;
  review_body: string;
}

export interface ReviewSignalsRecord {
  date: string;
  platform: string;
  sku_id: string;
  category: string;
  brand: string;
  review_count_day: number;
  review_count_cumulative: number;
  review_count_delta: number;
  avg_rating: number;
  rating_delta: number;
}

export interface GenZTractionRecord {
  date: string;
  platform: string;
  sku_id: string;
  avg_genz_rank: number;
  genz_keyword_coverage: number;
  genz_top10_slots: number;
  genz_rank_movement: number;
  review_count_delta: number;
  avg_rating: number;
  rating_delta: number;
  genz_traction_score: number;
  category: string;
  brand: string;
  brand_affinity: string;
  must_have_flag: number;
}

export interface DemandSignalsRecord {
  date: string;
  platform: string;
  sku_id: string;
  category: string;
  brand: string;
  availability_flag: number;
  stockout_flag: number;
  stockout_freq_7d: number;
  stockout_velocity: number;
  sale_price: number;
  price_change_flag: number;
  discount_percent: number;
  competitor_price: number;
  price_gap_pct: number;
  demand_intensity_score: number;
  lost_demand_proxy: number;
  sku_reliability_score: number;
  must_have_flag: number;
}

export interface PromotionROIRecord {
  sku_id: string;
  normalized_name: string;
  shopsy_name: string;
  meesho_name: string;
  brand: string;
  brand_affinity: string;
  category: string;
  must_have_flag: number;
  availability_flag: number;
  sale_price: number;
  price_gap_pct: number;
  competitor_price: number;
  meesho_promo_intensity: number;
  genz_traction_score: number;
  demand_intensity_score: number;
  lost_demand_proxy: number;
  promotion_roi_score: number;
  estimated_gmv_uplift: number;
  conversion_rate_benchmark: number;
  budget_allocation_flag: number;
  recommended_discount_depth: number;
  recommended_promo_type: string;
}

export interface CompetitorEvent {
  date: string;
  platform: string;
  category: string;
  brand: string;
  event_type: string;
  severity: string;
  description: string;
}

export interface PlatformSummary {
  platform: string;
  availability_rate: number;
  search_visibility_pct: number;
  active_promo_rate: number;
  avg_discount_depth: number;
  listed_sku_count: number;
  avg_genz_traction: number;
  avg_price_gap_pct: number;
  competitiveness_score: number;
}

export const datasets: {
  skuMaster: SKUMaster[];
  assortmentTracking: AssortmentRecord[];
  priceTracking: PriceRecord[];
  availabilityTracking: AvailabilityRecord[];
  searchRankTracking: SearchRankRecord[];
  reviewRaw: ReviewRawRecord[];
  reviewSignals: ReviewSignalsRecord[];
  genzTraction: GenZTractionRecord[];
  demandSignals: DemandSignalsRecord[];
  promotionROI: PromotionROIRecord[];
  competitorEvents: CompetitorEvent[];
  platformSummary: PlatformSummary[];
} = {
  skuMaster: [],
  assortmentTracking: [],
  priceTracking: [],
  availabilityTracking: [],
  searchRankTracking: [],
  reviewRaw: [],
  reviewSignals: [],
  genzTraction: [],
  demandSignals: [],
  promotionROI: [],
  competitorEvents: [],
  platformSummary: [],
};

// ── Backward-compat stubs (old pages still import these) ──

export interface GlobalFilters {
  city: string;
  platform: string;
  category: string;
  pincode: string;
}

export const DEFAULT_FILTERS: GlobalFilters = {
  city: "All Cities",
  platform: "All Platforms",
  category: "All Categories",
  pincode: "All Pincodes",
};

export function applyFilters<T>(data: T[], _filters: GlobalFilters): T[] {
  return data;
}

export function getUniquePincodes(): string[] { return []; }
export function getUniqueCategories(): string[] { return []; }
export function getPincodeCityMap(): Record<string, string> { return {}; }
export function getAssortmentData() { return datasets.assortmentTracking; }
export function getListingCountByPlatform() { return {}; }
export function getAvailabilityByPlatform() { return {}; }
export function getAvailabilityData() { return datasets.availabilityTracking; }
export function getEvents() { return datasets.competitorEvents; }
export function getPriceData() { return datasets.priceTracking; }
export function getSearchData() { return datasets.searchRankTracking; }

