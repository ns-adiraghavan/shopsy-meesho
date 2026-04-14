// Static imports removed — all datasets are hydrated at runtime from /data/*.json.gz via DataContext

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SKUMaster {
  sku_id: string;
  product_name: string;
  brand: string;
  category: string;
  subcategory: string;
  pack_size: string;
}

export interface AssortmentRecord {
  sku_id: string;
  brand?: string;
  category: string;
  product_name?: string;
  platform: string;
  city: string;
  listing_status: number;
  first_seen_date: string;
  pincode?: string;
}

export interface PriceRecord {
  date: string;
  sku_id: string;
  brand?: string;
  category: string;
  product_name?: string;
  platform: string;
  city: string;
  mrp: number;
  sale_price: number;
  discount_percent: number;
  promotion_flag: number;
  pincode?: string;
  promotion_type?: string;
}

export interface AvailabilityRecord {
  date: string;
  sku_id: string;
  brand?: string;
  category: string;
  product_name?: string;
  platform: string;
  city: string;
  availability_flag: number;
  pincode?: string;
  must_have_flag?: number;
}

export interface SearchRankRecord {
  date: string;
  keyword: string;
  platform: string;
  city: string;
  sku_id: string;
  brand?: string;
  category: string;
  product_name?: string;
  search_rank: number;
  sponsored_flag: number;
  pincode?: string;
  elite_rank_flag?: number;
  top10_flag?: number;
  top20_flag?: number;
}

export interface PlatformSummary {
  platform: string;
  price_index: number;
  availability_rate: number;
  search_visibility: number;
  sku_count: number;
  competitiveness_score: number;
}

export interface CompetitorEvent {
  event_id: string;
  date: string;
  platform: string;
  city: string;
  event_type: string;
  category: string;
  description: string;
  discount_percent: number;
  pincode?: string;
}

// ─── Global filter dimensions ─────────────────────────────────────────────────

export interface GlobalFilters {
  city: string;
  platform: string;
  pincode: string;   // "All Pincodes" = no filter
  category: string;  // "All Categories" = no filter
  dateFrom: string;  // "" = no lower bound
  dateTo: string;    // "" = no upper bound
}

export const DEFAULT_FILTERS: GlobalFilters = {
  city: "All Cities",
  platform: "All Platforms",
  pincode: "All Pincodes",
  category: "All Categories",
  dateFrom: "",
  dateTo: "",
};

// ─── Mutable dataset bundle (populated by DataContext at runtime) ─────────────

export const datasets = {
  skuMaster: [] as SKUMaster[],
  assortmentTracking: [] as AssortmentRecord[],
  priceTracking: [] as PriceRecord[],
  availabilityTracking: [] as AvailabilityRecord[],
  searchRankTracking: [] as SearchRankRecord[],
  platformSummary: [] as PlatformSummary[],
  competitorEvents: [] as CompetitorEvent[],
};

/** Called once by DataContext after all fetches complete */
export function hydrateDatasets(data: {
  priceTracking: PriceRecord[];
  availabilityTracking: AvailabilityRecord[];
  searchRankTracking: SearchRankRecord[];
  assortmentTracking: AssortmentRecord[];
}) {
  datasets.priceTracking = data.priceTracking;
  datasets.availabilityTracking = data.availabilityTracking;
  datasets.searchRankTracking = data.searchRankTracking;
  datasets.assortmentTracking = data.assortmentTracking;
}

// ─── Dynamic option lists (call after hydration) ──────────────────────────────

export function getUniquePincodes(): string[] {
  const s = new Set<string>();
  for (const r of datasets.priceTracking)        if (r.pincode) s.add(r.pincode);
  for (const r of datasets.availabilityTracking) if (r.pincode) s.add(r.pincode);
  for (const r of datasets.searchRankTracking)   if (r.pincode) s.add(r.pincode);
  for (const r of datasets.assortmentTracking)   if (r.pincode) s.add(r.pincode);
  return Array.from(s).sort();
}

/** Returns a map of pincode → city for display purposes */
export function getPincodeCityMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const sources = [
    ...datasets.priceTracking,
    ...datasets.availabilityTracking,
    ...datasets.searchRankTracking,
    ...datasets.assortmentTracking,
  ] as Array<{ pincode?: string; city?: string }>;
  for (const r of sources) {
    if (r.pincode && r.city && !map[r.pincode]) map[r.pincode] = r.city;
  }
  return map;
}

export function getUniqueCategories(): string[] {
  const s = new Set<string>();
  for (const r of datasets.priceTracking)        s.add(r.category);
  for (const r of datasets.availabilityTracking) s.add(r.category);
  for (const r of datasets.searchRankTracking)   s.add(r.category);
  for (const r of datasets.assortmentTracking)   s.add(r.category);
  for (const r of datasets.competitorEvents)     s.add(r.category);
  return Array.from(s).sort();
}

// ─── Core filter helper ───────────────────────────────────────────────────────

export function applyFilters<
  T extends {
    city?: string;
    platform?: string;
    pincode?: string;
    category?: string;
    date?: string;
  }
>(data: T[], filters: Partial<GlobalFilters>): T[] {
  const {
    city = "All Cities",
    platform = "All Platforms",
    pincode = "All Pincodes",
    category = "All Categories",
    dateFrom = "",
    dateTo = "",
  } = filters;

  return data.filter((row) => {
    if (city !== "All Cities" && row.city !== undefined && row.city !== city) return false;
    if (platform !== "All Platforms" && row.platform !== undefined && row.platform !== platform) return false;
    // Only apply pincode filter when the record has a pincode field
    if (pincode !== "All Pincodes" && row.pincode !== undefined && row.pincode !== pincode) return false;
    // Only apply category filter when the record has a category field
    if (category !== "All Categories" && row.category !== undefined && row.category !== category) return false;
    // Date filters — only apply when record has a date field
    if (row.date !== undefined) {
      if (dateFrom && row.date < dateFrom) return false;
      if (dateTo   && row.date > dateTo)   return false;
    }
    return true;
  });
}

/** Legacy 2-arg helper kept for backwards compatibility */
export function filterByContext<T extends { city?: string; platform?: string }>(
  data: T[],
  city: string,
  platform: string
): T[] {
  return applyFilters(data, { city, platform });
}

// ─── Module-specific helpers (accept full filters) ────────────────────────────

export const getPriceData = (
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): PriceRecord[] => {
  if (typeof cityOrFilters === "string") {
    return applyFilters(datasets.priceTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" });
  }
  return applyFilters(datasets.priceTracking, cityOrFilters);
};

export const getAvailabilityData = (
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): AvailabilityRecord[] => {
  if (typeof cityOrFilters === "string") {
    return applyFilters(datasets.availabilityTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" });
  }
  return applyFilters(datasets.availabilityTracking, cityOrFilters);
};

export const getSearchData = (
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): SearchRankRecord[] => {
  if (typeof cityOrFilters === "string") {
    return applyFilters(datasets.searchRankTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" });
  }
  return applyFilters(datasets.searchRankTracking, cityOrFilters);
};

export const getAssortmentData = (
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): AssortmentRecord[] => {
  if (typeof cityOrFilters === "string") {
    return applyFilters(datasets.assortmentTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" });
  }
  return applyFilters(datasets.assortmentTracking, cityOrFilters);
};

export const getPlatformSummary = (): PlatformSummary[] =>
  datasets.platformSummary;

export const getEvents = (
  cityOrFilters: string | Partial<GlobalFilters> = "All Cities",
  platform?: string
): CompetitorEvent[] => {
  if (typeof cityOrFilters === "string") {
    return applyFilters(datasets.competitorEvents, {
      city: cityOrFilters,
      platform: platform ?? "All Platforms",
    });
  }
  return applyFilters(datasets.competitorEvents, cityOrFilters);
};

// ─── Convenience aggregators ──────────────────────────────────────────────────

/** Average availability rate per platform for a given city */
export function getAvailabilityByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; rate: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.availabilityTracking, { city: cityOrFilters, platform: "All Platforms" })
      : applyFilters(datasets.availabilityTracking, { ...cityOrFilters, platform: "All Platforms" });

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
    totals[row.platform].sum += row.availability_flag;
    totals[row.platform].count += 1;
  }
  return Object.entries(totals).map(([p, { sum, count }]) => ({
    platform: p,
    rate: Math.round((sum / count) * 100),
  }));
}

/** Average discount % per platform for a given city */
export function getDiscountByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; avgDiscount: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.priceTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" })
      : applyFilters(datasets.priceTracking, cityOrFilters);

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
    totals[row.platform].sum += row.discount_percent;
    totals[row.platform].count += 1;
  }
  return Object.entries(totals).map(([p, { sum, count }]) => ({
    platform: p,
    avgDiscount: parseFloat((sum / count).toFixed(2)),
  }));
}

/** Elite rank share (top-3 positions) % per platform */
export function getEliteRankShareByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; elite_rank_share_pct: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.searchRankTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" })
      : applyFilters(datasets.searchRankTracking, cityOrFilters);

  const totals: Record<string, { elite: number; total: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { elite: 0, total: 0 };
    totals[row.platform].total += 1;
    if (row.search_rank <= 3) totals[row.platform].elite += 1;
  }
  return Object.entries(totals)
    .map(([p, { elite, total }]) => ({
      platform: p,
      elite_rank_share_pct: parseFloat(((elite / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.elite_rank_share_pct - a.elite_rank_share_pct);
}

/** Top-10 search presence % per platform */
export function getTop10PresenceByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; top10_presence_pct: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.searchRankTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" })
      : applyFilters(datasets.searchRankTracking, cityOrFilters);

  const totals: Record<string, { top10: number; total: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { top10: 0, total: 0 };
    totals[row.platform].total += 1;
    if (row.search_rank <= 10) totals[row.platform].top10 += 1;
  }
  return Object.entries(totals)
    .map(([p, { top10, total }]) => ({
      platform: p,
      top10_presence_pct: parseFloat(((top10 / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.top10_presence_pct - a.top10_presence_pct);
}

/** Sponsored search share per platform */
export function getSponsoredShareByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; sponsoredShare: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.searchRankTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" })
      : applyFilters(datasets.searchRankTracking, cityOrFilters);

  const totals: Record<string, { sponsored: number; total: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sponsored: 0, total: 0 };
    totals[row.platform].sponsored += row.sponsored_flag;
    totals[row.platform].total += 1;
  }
  return Object.entries(totals).map(([p, { sponsored, total }]) => ({
    platform: p,
    sponsoredShare: parseFloat(((sponsored / total) * 100).toFixed(1)),
  }));
}

/** Listed SKU count per platform */
export function getListingCountByPlatform(
  cityOrFilters: string | Partial<GlobalFilters>,
  platform?: string
): { platform: string; listed: number; notListed: number }[] {
  const data =
    typeof cityOrFilters === "string"
      ? applyFilters(datasets.assortmentTracking, { city: cityOrFilters, platform: platform ?? "All Platforms" })
      : applyFilters(datasets.assortmentTracking, cityOrFilters);

  const totals: Record<string, { listed: number; notListed: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { listed: 0, notListed: 0 };
    if (row.listing_status === 1) totals[row.platform].listed += 1;
    else totals[row.platform].notListed += 1;
  }
  return Object.entries(totals).map(([p, counts]) => ({
    platform: p,
    ...counts,
  }));
}
