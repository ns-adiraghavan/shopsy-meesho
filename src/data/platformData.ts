// Public Data Intelligence platform data
// Platforms and cities for quick-commerce competitive intelligence

export const platforms = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"] as const;
export type Platform = typeof platforms[number];

export const cities = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"] as const;
export type City = typeof cities[number];

export const categories = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Snacks & Beverages",
  "Personal Care",
  "Household Essentials",
  "Staples & Grains",
] as const;

// KPI data for Competitive Overview
export const competitiveOverviewKPIs = [
  {
    title: "Platforms Tracked",
    value: "4",
    change: 0,
    trend: "neutral" as const,
    status: "low" as const,
    tooltip: "Number of quick-commerce platforms actively monitored.",
  },
  {
    title: "Cities Covered",
    value: "5",
    change: 0,
    trend: "neutral" as const,
    status: "low" as const,
    tooltip: "Metro cities included in intelligence reports.",
  },
  {
    title: "Price Gaps Detected",
    value: "142",
    change: 18,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "SKUs where a platform charges noticeably more or less than others.",
  },
  {
    title: "Overall Index Score",
    value: "73/100",
    change: 4,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "Weighted composite intelligence score across all modules.",
  },
];

// KPI data for Pricing & Promotion Intelligence
export const pricingKPIs = [
  {
    title: "Avg Price Variance",
    value: "8.4%",
    change: 1.2,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "Average price variance across platforms for identical SKUs.",
  },
  {
    title: "Active Promotions",
    value: "384",
    change: 47,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "Total active promotional offers across all platforms right now.",
  },
  {
    title: "Blinkit Price Index",
    value: "102.3",
    change: 0.7,
    trend: "up" as const,
    status: "low" as const,
    tooltip: "Blinkit price index relative to category average (100 = parity).",
  },
  {
    title: "Deepest Discount",
    value: "45% off",
    change: 5,
    trend: "down" as const,
    status: "critical" as const,
    tooltip: "Largest single promotional discount detected across all platforms.",
  },
];

// KPI data for Search & Digital Shelf
export const searchKPIs = [
  {
    title: "Avg Shelf Position",
    value: "4.2",
    change: 0.3,
    trend: "down" as const,
    status: "medium" as const,
    tooltip: "Average search rank position across top queries on monitored platforms.",
  },
  {
    title: "Sponsored Share",
    value: "38%",
    change: 3,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "Share of top-10 search results that are sponsored/paid placements.",
  },
  {
    title: "Brand Visibility Score",
    value: "61/100",
    change: 2,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "Composite score for brand prominence on digital shelves.",
  },
  {
    title: "Keywords Tracked",
    value: "1,240",
    change: 60,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "low" as const,
    tooltip: "Total search keywords being monitored across platforms.",
  },
];

// KPI data for Assortment Intelligence
export const assortmentKPIs = [
  {
    title: "Exclusive SKUs",
    value: "67",
    change: 5,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "low" as const,
    tooltip: "SKUs available exclusively on one platform.",
  },
  {
    title: "Assortment Overlap",
    value: "72%",
    change: 2,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "Percentage of SKUs common across all four platforms.",
  },
  {
    title: "New Listings (7d)",
    value: "213",
    change: 31,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "New product listings added across platforms in the last 7 days.",
  },
  {
    title: "De-listed SKUs",
    value: "38",
    change: 12,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "SKUs removed from platform listings in the last 7 days.",
  },
];

// KPI data for Availability Intelligence
export const availabilityKPIs = [
  {
    title: "Out-of-Stock Rate",
    value: "6.2%",
    change: 1.1,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "Percentage of tracked SKUs currently out of stock across platforms.",
  },
  {
    title: "Stockout Events (24h)",
    value: "89",
    change: 14,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "critical" as const,
    tooltip: "Number of stockout events detected in the last 24 hours.",
  },
  {
    title: "Fill Rate Score",
    value: "93.8%",
    change: 0.5,
    trend: "down" as const,
    status: "medium" as const,
    tooltip: "Platform's ability to fulfill demand for tracked SKUs.",
  },
  {
    title: "Zepto Availability",
    value: "97.1%",
    change: 0.2,
    trend: "up" as const,
    status: "low" as const,
    tooltip: "SKU availability rate on Zepto across all monitored cities.",
  },
];

// KPI data for Local Market Intelligence
export const localMarketKPIs = [
  {
    title: "Cities Analysed",
    value: "5",
    change: 0,
    trend: "neutral" as const,
    status: "low" as const,
    tooltip: "Metro markets actively covered in this report.",
  },
  {
    title: "Regional Price Gaps",
    value: "11.3%",
    change: 0.8,
    trend: "up" as const,
    status: "medium" as const,
    tooltip: "Average price difference for the same SKU across cities.",
  },
  {
    title: "Hyper-local Promos",
    value: "56",
    change: 9,
    changeType: "absolute" as const,
    trend: "up" as const,
    status: "high" as const,
    tooltip: "Promotions active in only one city, not visible nationally.",
  },
  {
    title: "Top Market: Bangalore",
    value: "82/100",
    change: 3,
    trend: "up" as const,
    status: "low" as const,
    tooltip: "Composite market intelligence score for Bangalore.",
  },
];

// Heatmap data reframed for platforms × categories
export const platformHeatmapData = [
  {
    category: "Fruits & Vegetables",
    competitors: [
      { name: "Zepto", competitiveness: 88, priceGap: -2.1, ourPrice: "₹45", theirPrice: "₹44", lastUpdated: "2024-01-30T14:30:00Z", skuCount: 210 },
      { name: "Blinkit", competitiveness: 74, priceGap: 5.3, ourPrice: "₹45", theirPrice: "₹47", lastUpdated: "2024-01-30T12:15:00Z", skuCount: 198 },
      { name: "Swiggy Instamart", competitiveness: 65, priceGap: 8.7, ourPrice: "₹45", theirPrice: "₹49", lastUpdated: "2024-01-30T16:45:00Z", skuCount: 176 },
      { name: "BigBasket Now", competitiveness: 81, priceGap: 1.2, ourPrice: "₹45", theirPrice: "₹45", lastUpdated: "2024-01-30T13:22:00Z", skuCount: 240 },
    ],
  },
  {
    category: "Dairy & Eggs",
    competitors: [
      { name: "Zepto", competitiveness: 76, priceGap: 3.4, ourPrice: "₹62", theirPrice: "₹64", lastUpdated: "2024-01-30T15:10:00Z", skuCount: 88 },
      { name: "Blinkit", competitiveness: 44, priceGap: 15.2, ourPrice: "₹62", theirPrice: "₹71", lastUpdated: "2024-01-30T11:30:00Z", skuCount: 74 },
      { name: "Swiggy Instamart", competitiveness: 85, priceGap: -1.8, ourPrice: "₹62", theirPrice: "₹61", lastUpdated: "2024-01-30T17:05:00Z", skuCount: 95 },
      { name: "BigBasket Now", competitiveness: 70, priceGap: 4.6, ourPrice: "₹62", theirPrice: "₹65", lastUpdated: "2024-01-30T14:18:00Z", skuCount: 102 },
    ],
  },
  {
    category: "Snacks & Beverages",
    competitors: [
      { name: "Zepto", competitiveness: 93, priceGap: -5.2, ourPrice: "₹120", theirPrice: "₹114", lastUpdated: "2024-01-30T16:20:00Z", skuCount: 430 },
      { name: "Blinkit", competitiveness: 37, priceGap: 22.1, ourPrice: "₹120", theirPrice: "₹146", lastUpdated: "2024-01-30T10:45:00Z", skuCount: 310 },
      { name: "Swiggy Instamart", competitiveness: 78, priceGap: 2.9, ourPrice: "₹120", theirPrice: "₹123", lastUpdated: "2024-01-30T15:55:00Z", skuCount: 390 },
      { name: "BigBasket Now", competitiveness: 62, priceGap: 9.4, ourPrice: "₹120", theirPrice: "₹131", lastUpdated: "2024-01-30T12:40:00Z", skuCount: 280 },
    ],
  },
  {
    category: "Personal Care",
    competitors: [
      { name: "Zepto", competitiveness: 58, priceGap: 12.3, ourPrice: "₹220", theirPrice: "₹247", lastUpdated: "2024-01-30T13:55:00Z", skuCount: 560 },
      { name: "Blinkit", competitiveness: 24, priceGap: 45.7, ourPrice: "₹220", theirPrice: "₹321", lastUpdated: "2024-01-30T09:30:00Z", skuCount: 390 },
      { name: "Swiggy Instamart", competitiveness: 82, priceGap: -0.5, ourPrice: "₹220", theirPrice: "₹219", lastUpdated: "2024-01-30T16:10:00Z", skuCount: 480 },
      { name: "BigBasket Now", competitiveness: 89, priceGap: -3.1, ourPrice: "₹220", theirPrice: "₹213", lastUpdated: "2024-01-30T14:35:00Z", skuCount: 520 },
    ],
  },
];

// Category rollup reframed for quick-commerce
export const platformCategoryRollup = [
  { name: "Fruits & Vegetables", avgElasticity: 7.8, promoResponse: "High", avgRiskLevel: "High" },
  { name: "Dairy & Eggs", avgElasticity: 4.2, promoResponse: "Medium", avgRiskLevel: "Medium" },
  { name: "Snacks & Beverages", avgElasticity: 6.5, promoResponse: "High", avgRiskLevel: "High" },
  { name: "Personal Care", avgElasticity: 3.9, promoResponse: "Low", avgRiskLevel: "Low" },
  { name: "Household Essentials", avgElasticity: 5.1, promoResponse: "Medium", avgRiskLevel: "Medium" },
  { name: "Staples & Grains", avgElasticity: 2.7, promoResponse: "Low", avgRiskLevel: "Low" },
];

// Top tracked items (replacing "risk SKUs" with price-gap leaders)
export const topPriceGapItems = [
  {
    sku: "FRV-TOM-KG",
    name: "Tomatoes (1 kg)",
    category: "Fruits & Vegetables",
    currentPrice: "₹45",
    competitorAvg: "₹38",
    gap: "+18.4%",
    riskLevel: "Critical" as const,
    marginPercent: 22,
    elasticityScore: 8.1,
    promoResponse: "High" as const,
  },
  {
    sku: "DRY-MLK-AML",
    name: "Amul Full Cream Milk 1L",
    category: "Dairy & Eggs",
    currentPrice: "₹68",
    competitorAvg: "₹62",
    gap: "+9.7%",
    riskLevel: "High" as const,
    marginPercent: 12,
    elasticityScore: 6.3,
    promoResponse: "Medium" as const,
  },
  {
    sku: "SNK-LAY-CLR-40",
    name: "Lays Classic 40g",
    category: "Snacks & Beverages",
    currentPrice: "₹22",
    competitorAvg: "₹20",
    gap: "+10.0%",
    riskLevel: "High" as const,
    marginPercent: 18,
    elasticityScore: 7.4,
    promoResponse: "High" as const,
  },
  {
    sku: "HPC-HHD-500",
    name: "Head & Shoulders 500ml",
    category: "Personal Care",
    currentPrice: "₹349",
    competitorAvg: "₹319",
    gap: "+9.4%",
    riskLevel: "Medium" as const,
    marginPercent: 28,
    elasticityScore: 4.2,
    promoResponse: "Low" as const,
  },
  {
    sku: "GRC-TTM-SFW-1KG",
    name: "Tata Salt 1 kg",
    category: "Staples & Grains",
    currentPrice: "₹24",
    competitorAvg: "₹21",
    gap: "+14.3%",
    riskLevel: "Medium" as const,
    marginPercent: 9,
    elasticityScore: 3.8,
    promoResponse: "Low" as const,
  },
];

// Alerts reframed for platform intelligence
export const platformAlertsData = [
  {
    id: "1",
    type: "competitor" as const,
    title: "Blinkit Flash Sale — Snacks",
    description: "Blinkit launched a 4-hour flash sale with up to 40% off on 78 snack SKUs across Bangalore and Mumbai.",
    severity: "critical" as const,
    timestamp: "5 minutes ago",
    date: "2024-01-30",
    category: "Snacks & Beverages",
    competitor: "Blinkit",
    affectedSKUs: 78,
    averageDropPercent: 40,
  },
  {
    id: "2",
    type: "inventory" as const,
    title: "Zepto — Stockout in Delhi NCR",
    description: "32 dairy SKUs are out of stock on Zepto in Delhi NCR, up from 12 yesterday.",
    severity: "high" as const,
    timestamp: "22 minutes ago",
    date: "2024-01-30",
    category: "Dairy & Eggs",
    affectedSKUs: 32,
  },
  {
    id: "3",
    type: "competitor" as const,
    title: "Swiggy Instamart Price Drop",
    description: "Swiggy Instamart reduced prices on 19 personal care SKUs by an average of 12%.",
    severity: "medium" as const,
    timestamp: "1 hour ago",
    date: "2024-01-30",
    category: "Personal Care",
    competitor: "Swiggy Instamart",
    affectedSKUs: 19,
    averageDropPercent: 12,
  },
  {
    id: "4",
    type: "competitor" as const,
    title: "BigBasket Now — New Exclusive Listings",
    description: "BigBasket Now added 45 exclusive private-label SKUs in Staples & Grains this week.",
    severity: "medium" as const,
    timestamp: "3 hours ago",
    date: "2024-01-30",
    category: "Staples & Grains",
    competitor: "BigBasket Now",
    affectedSKUs: 45,
  },
  {
    id: "5",
    type: "inventory" as const,
    title: "Platform-wide Overstock — Beverages",
    description: "All four platforms showing elevated inventory on carbonated beverages ahead of festive season.",
    severity: "low" as const,
    timestamp: "5 hours ago",
    date: "2024-01-30",
    category: "Snacks & Beverages",
    affectedSKUs: 23,
  },
];
