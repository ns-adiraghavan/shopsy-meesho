// @ts-nocheck
import { datasets } from "@/data/dataLoader";
import { GlobalFilters } from "@/data/dataLoader";

// ─── Sample size cap — prevents 700k-row iteration in the browser ─────────────
const SAMPLE_SIZE = 2000;

/**
 * Computes a rich data context string from live datasets to inject into the AI prompt.
 * Samples up to SAMPLE_SIZE rows per dataset before aggregation to keep computation fast.
 */
export function buildDataContext(filters: GlobalFilters): string {
  const { platformSummary, competitorEvents } = datasets;

  // ── Sample raw datasets before filtering ────────────────────────────────────
  const priceTrackingSample  = datasets.priceTracking.slice(0, SAMPLE_SIZE);
  const availSample          = datasets.availabilityTracking.slice(0, SAMPLE_SIZE);
  const searchSample         = datasets.searchRankTracking.slice(0, SAMPLE_SIZE);
  const assortSample         = datasets.assortmentTracking.slice(0, SAMPLE_SIZE);

  const cityFilter     = filters.city     !== "All Cities"      ? filters.city     : null;
  const platformFilter = filters.platform !== "All Platforms"   ? filters.platform : null;
  const categoryFilter = filters.category !== "All Categories"  ? filters.category : null;

  const applyBase = <T extends { city?: string; platform?: string; category?: string }>(
    data: T[]
  ): T[] =>
    data.filter(
      (r) =>
        (!cityFilter     || r.city     === cityFilter)     &&
        (!platformFilter || r.platform === platformFilter) &&
        (!categoryFilter || r.category === categoryFilter)
    );

  const price  = applyBase(priceTrackingSample);
  const avail  = applyBase(availSample);
  const search = applyBase(searchSample);
  const assort = applyBase(assortSample);
  const events = applyBase(competitorEvents);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  // ── Pricing stats ──────────────────────────────────────────────────────────
  const platformDiscounts: Record<string, number[]> = {};
  const platformPromo: Record<string, number[]> = {};
  const categoryDiscounts: Record<string, number[]> = {};
  for (const r of price) {
    if (!platformDiscounts[r.platform]) platformDiscounts[r.platform] = [];
    platformDiscounts[r.platform].push(r.discount_percent);
    if (!platformPromo[r.platform]) platformPromo[r.platform] = [];
    platformPromo[r.platform].push(r.promotion_flag);
    if (!categoryDiscounts[r.category]) categoryDiscounts[r.category] = [];
    categoryDiscounts[r.category].push(r.discount_percent);
  }

  const pricingLines: string[] = [];
  for (const [p, vals] of Object.entries(platformDiscounts)) {
    const promoRate = pct(avg(platformPromo[p] ?? []));
    pricingLines.push(`  ${p}: avg_discount=${avg(vals).toFixed(1)}%, promo_rate=${promoRate}`);
  }
  const topDiscountCategory = Object.entries(categoryDiscounts)
    .map(([c, v]) => ({ c, d: avg(v) }))
    .sort((a, b) => b.d - a.d)[0];

  // ── Availability stats ─────────────────────────────────────────────────────
  const platformAvail: Record<string, number[]> = {};
  const platformMustHave: Record<string, { total: number; oos: number }> = {};
  const cityAvail: Record<string, number[]> = {};
  for (const r of avail) {
    if (!platformAvail[r.platform]) platformAvail[r.platform] = [];
    platformAvail[r.platform].push(r.availability_flag);
    if (!cityAvail[r.city]) cityAvail[r.city] = [];
    cityAvail[r.city].push(r.availability_flag);
    if (r.must_have_flag === 1) {
      if (!platformMustHave[r.platform]) platformMustHave[r.platform] = { total: 0, oos: 0 };
      platformMustHave[r.platform].total += 1;
      if (!r.availability_flag) platformMustHave[r.platform].oos += 1;
    }
  }

  const availLines: string[] = [];
  for (const [p, vals] of Object.entries(platformAvail)) {
    const mh = platformMustHave[p];
    const mustHaveOOS = mh ? `must_have_oos=${((mh.oos / mh.total) * 100).toFixed(0)}%` : "";
    availLines.push(`  ${p}: availability=${pct(avg(vals))}${mustHaveOOS ? `, ${mustHaveOOS}` : ""}`);
  }

  const cityAvailLines = Object.entries(cityAvail)
    .map(([c, v]) => `  ${c}: ${pct(avg(v))}`)
    .sort();

  // ── Search stats ────────────────────────────────────────────────────────────
  const platformTop10: Record<string, number[]> = {};
  const platformElite: Record<string, number[]> = {};
  const platformSponsored: Record<string, number[]> = {};
  const keywordRanks: Record<string, Record<string, number[]>> = {};
  for (const r of search) {
    if (!platformTop10[r.platform]) platformTop10[r.platform] = [];
    platformTop10[r.platform].push(r.top10_flag ?? (r.search_rank <= 10 ? 1 : 0));
    if (!platformElite[r.platform]) platformElite[r.platform] = [];
    platformElite[r.platform].push(r.elite_rank_flag ?? (r.search_rank <= 3 ? 1 : 0));
    if (!platformSponsored[r.platform]) platformSponsored[r.platform] = [];
    platformSponsored[r.platform].push(r.sponsored_flag);
    if (!keywordRanks[r.keyword]) keywordRanks[r.keyword] = {};
    if (!keywordRanks[r.keyword][r.platform]) keywordRanks[r.keyword][r.platform] = [];
    keywordRanks[r.keyword][r.platform].push(r.search_rank);
  }

  const searchLines: string[] = [];
  for (const [p, vals] of Object.entries(platformTop10)) {
    searchLines.push(
      `  ${p}: top10_share=${pct(avg(vals))}, elite_share=${pct(avg(platformElite[p] ?? []))}, sponsored_share=${pct(avg(platformSponsored[p] ?? []))}`
    );
  }

  // Top 5 competitive keywords
  const keywordLines = Object.entries(keywordRanks)
    .slice(0, 5)
    .map(([kw, platforms]) => {
      const platStr = Object.entries(platforms)
        .map(([p, ranks]) => `${p}:${avg(ranks).toFixed(1)}`)
        .join(", ");
      return `  "${kw}": ${platStr}`;
    });

  // ── Assortment stats ────────────────────────────────────────────────────────
  const platformListing: Record<string, { listed: number; total: number }> = {};
  for (const r of assort) {
    if (!platformListing[r.platform]) platformListing[r.platform] = { listed: 0, total: 0 };
    platformListing[r.platform].total += 1;
    if (r.listing_status === 1) platformListing[r.platform].listed += 1;
  }
  const assortLines = Object.entries(platformListing).map(
    ([p, { listed, total }]) => `  ${p}: listing_coverage=${((listed / total) * 100).toFixed(0)}%`
  );

  // ── Competitive events ──────────────────────────────────────────────────────
  const recentEvents = events.slice(0, 5).map(
    (e) => `  [${e.date}] ${e.platform} — ${e.event_type} in ${e.category} (${e.city}): ${e.description}${e.discount_percent != null ? ` | discount=${e.discount_percent}%` : ""}`
  );

  // ── Platform summary ────────────────────────────────────────────────────────
  const platformSummaryLines = platformSummary.map(
    (p) =>
      `  ${p.platform}: availability=${p.availability_rate}%, search_visibility=${p.search_visibility}, competitiveness=${p.competitiveness_score}`
  );

  return [
    "### PRICING & PROMOTIONS",
    ...pricingLines,
    topDiscountCategory
      ? `  Top discount category: ${topDiscountCategory.c} (${topDiscountCategory.d.toFixed(1)}% avg discount)`
      : "",
    "",
    "### AVAILABILITY",
    ...availLines,
    "  City availability rates:",
    ...cityAvailLines,
    "",
    "### SEARCH & SHELF VISIBILITY",
    ...searchLines,
    "  Top keyword avg ranks (lower = better):",
    ...keywordLines,
    "",
    "### ASSORTMENT COVERAGE",
    ...assortLines,
    "",
    "### RECENT COMPETITIVE EVENTS",
    ...(recentEvents.length ? recentEvents : ["  No recent events"]),
    "",
    "### PLATFORM SUMMARY",
    ...platformSummaryLines,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .slice(0, 6000);
}

/**
 * Builds the page-level context description for "Explain This Page" feature.
 */
export function buildPageContext(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Competitive Overview — overall platform competitiveness scores, category price gaps, top price-gap SKUs",
    "/dashboard/pricing":
      "Pricing & Promotion Intelligence — discount intensity by platform, promotion share, SKU cross-platform price comparison, active promotions",
    "/dashboard/search":
      "Search & Digital Shelf Visibility — top-10 presence, elite rank share (top-3), sponsored vs organic share, keyword position tracker, competitive search advantage scores",
    "/dashboard/assortment":
      "Assortment Intelligence — category coverage by platform, listed vs missing SKUs, platform exclusives",
    "/dashboard/availability":
      "Availability Intelligence — platform reliability, must-have SKU availability, category health, active stockout events, critical stockout impact index",
    "/dashboard/local":
      "Local Market Intelligence — city competitiveness comparison, hyperlocal price variance by pincode, promotion intensity by city",
    "/dashboard/events":
      "Competitive Events — flash sales, promo surges, price drops, and market shocks across platforms and cities",
  };
  return map[pathname] ?? "Retail Intelligence Dashboard";
}
