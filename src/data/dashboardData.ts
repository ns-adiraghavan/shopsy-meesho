// Enhanced sample data for the Retail Pricing AI Dashboard

export const kpiData = [
  {
    title: "Average Price Gap",
    value: "-3.2%",
    change: 1.2,
    trend: 'up' as const,
    status: 'medium' as const,
    tooltip: "The average difference between our prices and competitors' prices across all SKUs.",
    history: [
      { date: '2024-01-15', value: -4.1 },
      { date: '2024-01-20', value: -3.8 },
      { date: '2024-01-25', value: -3.5 },
      { date: '2024-01-30', value: -3.2 },
    ]
  },
  {
    title: "Margin Impact",
    value: "12.8%",
    change: -0.8,
    tooltip: "The percentage change in profit margins due to pricing differences compared to competitors.",
    trend: 'down' as const,
    status: 'high' as const,
    history: [
      { date: '2024-01-15', value: 13.6 },
      { date: '2024-01-20', value: 13.2 },
      { date: '2024-01-25', value: 13.0 },
      { date: '2024-01-30', value: 12.8 },
    ]
  },
  {
    title: "SKUs at Risk",
    value: "247",
    change: 15,
    changeType: 'absolute' as const,
    trend: 'up' as const,
    status: 'critical' as const,
    tooltip: "The total number of products with pricing gaps that could affect competitiveness or margins.",
    history: [
      { date: '2024-01-15', value: 232 },
      { date: '2024-01-20', value: 238 },
      { date: '2024-01-25', value: 243 },
      { date: '2024-01-30', value: 247 },
    ]
  },
  {
    title: "Competitive Score",
    value: "78/100",
    change: 5,
    trend: 'up' as const,
    status: 'low' as const,
    tooltip: "A weighted score based on pricing competitiveness across categories and competitors.",
    history: [
      { date: '2024-01-15', value: 73 },
      { date: '2024-01-20', value: 75 },
      { date: '2024-01-25', value: 76 },
      { date: '2024-01-30', value: 78 },
    ]
  },
];

export const heatmapData = [
  {
    category: "Electronics",
    competitors: [
      { 
        name: "Amazon", 
        competitiveness: 85, 
        priceGap: -2.1,
        ourPrice: "₹49,999",
        theirPrice: "₹48,949",
        lastUpdated: "2024-01-30T14:30:00Z",
        skuCount: 423
      },
      { 
        name: "Best Buy", 
        competitiveness: 72, 
        priceGap: 5.3,
        ourPrice: "₹49,999",
        theirPrice: "₹52,649",
        lastUpdated: "2024-01-30T12:15:00Z",
        skuCount: 312
      },
      { 
        name: "Walmart", 
        competitiveness: 67, 
        priceGap: 8.7,
        ourPrice: "₹49,999",
        theirPrice: "₹54,349",
        lastUpdated: "2024-01-30T16:45:00Z",
        skuCount: 287
      },
      { 
        name: "Target", 
        competitiveness: 79, 
        priceGap: 1.2,
        ourPrice: "₹49,999",
        theirPrice: "₹50,599",
        lastUpdated: "2024-01-30T13:22:00Z",
        skuCount: 198
      },
    ],
  },
  {
    category: "Home & Garden",
    competitors: [
      { 
        name: "Amazon", 
        competitiveness: 78, 
        priceGap: 3.4,
        ourPrice: "₹20,849",
        theirPrice: "₹21,557",
        lastUpdated: "2024-01-30T15:10:00Z",
        skuCount: 567
      },
      { 
        name: "Best Buy", 
        competitiveness: 45, 
        priceGap: 15.2,
        ourPrice: "₹20,849",
        theirPrice: "₹24,015",
        lastUpdated: "2024-01-30T11:30:00Z",
        skuCount: 156
      },
      { 
        name: "Walmart", 
        competitiveness: 83, 
        priceGap: -1.8,
        ourPrice: "₹20,849",
        theirPrice: "₹20,474",
        lastUpdated: "2024-01-30T17:05:00Z",
        skuCount: 445
      },
      { 
        name: "Target", 
        competitiveness: 71, 
        priceGap: 4.6,
        ourPrice: "₹20,849",
        theirPrice: "₹21,808",
        lastUpdated: "2024-01-30T14:18:00Z",
        skuCount: 234
      },
    ],
  },
  {
    category: "Sports & Outdoors",
    competitors: [
      { 
        name: "Amazon", 
        competitiveness: 92, 
        priceGap: -5.2,
        ourPrice: "₹10,839",
        theirPrice: "₹10,276",
        lastUpdated: "2024-01-30T16:20:00Z",
        skuCount: 689
      },
      { 
        name: "Best Buy", 
        competitiveness: 38, 
        priceGap: 22.1,
        ourPrice: "₹10,839",
        theirPrice: "₹13,234",
        lastUpdated: "2024-01-30T10:45:00Z",
        skuCount: 98
      },
      { 
        name: "Walmart", 
        competitiveness: 76, 
        priceGap: 2.9,
        ourPrice: "₹10,839",
        theirPrice: "₹11,153",
        lastUpdated: "2024-01-30T15:55:00Z",
        skuCount: 356
      },
      { 
        name: "Target", 
        competitiveness: 64, 
        priceGap: 9.4,
        ourPrice: "₹10,839",
        theirPrice: "₹11,858",
        lastUpdated: "2024-01-30T12:40:00Z",
        skuCount: 267
      },
    ],
  },
  {
    category: "Clothing",
    competitors: [
      { 
        name: "Amazon", 
        competitiveness: 59, 
        priceGap: 12.3,
        ourPrice: "₹6,669",
        theirPrice: "₹7,489",
        lastUpdated: "2024-01-30T13:55:00Z",
        skuCount: 1234
      },
      { 
        name: "Best Buy", 
        competitiveness: 25, 
        priceGap: 45.7,
        ourPrice: "₹6,669",
        theirPrice: "₹9,716",
        lastUpdated: "2024-01-30T09:30:00Z",
        skuCount: 45
      },
      { 
        name: "Walmart", 
        competitiveness: 81, 
        priceGap: -0.5,
        ourPrice: "₹6,669",
        theirPrice: "₹6,636",
        lastUpdated: "2024-01-30T16:10:00Z",
        skuCount: 789
      },
      { 
        name: "Target", 
        competitiveness: 88, 
        priceGap: -3.1,
        ourPrice: "₹6,669",
        theirPrice: "₹6,462",
        lastUpdated: "2024-01-30T14:35:00Z",
        skuCount: 567
      },
    ],
  },
];

export const alertsData = [
  {
    id: "1",
    type: "competitor" as const,
    title: "Amazon Price Drop Alert",
    description: "Amazon dropped prices by 15% on 23 SKUs in Electronics category",
    severity: "critical" as const,
    timestamp: "2 minutes ago",
    date: "2024-01-30",
    category: "Electronics",
    competitor: "Amazon",
    affectedSKUs: 23,
    averageDropPercent: 15,
  },
  {
    id: "2",
    type: "inventory" as const,
    title: "Low Inventory Warning",
    description: "45 SKUs have inventory below reorder threshold",
    severity: "high" as const,
    timestamp: "15 minutes ago",
    date: "2024-01-30",
    category: "Sports & Outdoors",
    affectedSKUs: 45,
  },
  {
    id: "3",
    type: "compliance" as const,
    title: "MAP Violation Detected",
    description: "3 SKUs are priced below minimum advertised price",
    severity: "medium" as const,
    timestamp: "1 hour ago",
    date: "2024-01-30",
    category: "Clothing",
    affectedSKUs: 3,
  },
  {
    id: "4",
    type: "competitor" as const,
    title: "Walmart Promotion Started",
    description: "New promotion launched affecting 67 competing SKUs",
    severity: "medium" as const,
    timestamp: "2 hours ago",
    date: "2024-01-30",
    category: "Home & Garden",
    competitor: "Walmart",
    affectedSKUs: 67,
  },
  {
    id: "5",
    type: "inventory" as const,
    title: "Overstock Alert",
    description: "12 SKUs have excess inventory affecting pricing flexibility",
    severity: "low" as const,
    timestamp: "3 hours ago",
    date: "2024-01-30",
    category: "Electronics",
    affectedSKUs: 12,
  },
  {
    id: "6",
    type: "competitor" as const,
    title: "Target Flash Sale",
    description: "Target launched 24-hour flash sale on 89 competing products",
    severity: "high" as const,
    timestamp: "4 hours ago",
    date: "2024-01-29",
    category: "Sports & Outdoors",
    competitor: "Target",
    affectedSKUs: 89,
  },
  {
    id: "7",
    type: "compliance" as const,
    title: "Price Monitoring Alert",
    description: "7 SKUs require pricing review due to cost changes",
    severity: "low" as const,
    timestamp: "6 hours ago",
    date: "2024-01-29",
    category: "Home & Garden",
    affectedSKUs: 7,
  },
];

export const topRiskSKUs = [
  {
    sku: "ELEC-HD-4K-55",
    name: "55\" 4K Smart TV",
    category: "Electronics",
    currentPrice: "₹49,999",
    competitorAvg: "₹45,849",
    gap: "+9.1%",
    riskLevel: "Critical" as const,
    marginPercent: 18.2,
    elasticityScore: 7.8,
    promoResponse: "High" as const,
  },
  {
    sku: "SPRT-RUN-SHU-M",
    name: "Men's Running Shoes",
    category: "Sports",
    currentPrice: "₹10,839",
    competitorAvg: "₹9,169",
    gap: "+18.2%",
    riskLevel: "Critical" as const,
    marginPercent: 32.5,
    elasticityScore: 6.2,
    promoResponse: "Medium" as const,
  },
  {
    sku: "HOME-VAC-CORD",
    name: "Cordless Vacuum",
    category: "Home & Garden",
    currentPrice: "₹20,849",
    competitorAvg: "₹18,349",
    gap: "+13.6%",
    riskLevel: "High" as const,
    marginPercent: 28.4,
    elasticityScore: 4.9,
    promoResponse: "Medium" as const,
  },
  {
    sku: "CLTH-JNS-DNM-32",
    name: "Denim Jeans 32\"",
    category: "Clothing",
    currentPrice: "₹6,669",
    competitorAvg: "₹5,834",
    gap: "+14.3%",
    riskLevel: "High" as const,
    marginPercent: 42.1,
    elasticityScore: 8.4,
    promoResponse: "High" as const,
  },
  {
    sku: "HLTH-VIT-MULT",
    name: "Multivitamin 100ct",
    category: "Health & Beauty",
    currentPrice: "₹2,084",
    competitorAvg: "₹1,834",
    gap: "+13.6%",
    riskLevel: "Medium" as const,
    marginPercent: 35.7,
    elasticityScore: 3.1,
    promoResponse: "Low" as const,
  },
];

// Category-level rollup data
export const categoryRollupData = [
  {
    name: "Electronics",
    avgElasticity: 7.8,
    promoResponse: "High",
    avgRiskLevel: "High"
  },
  {
    name: "Apparel",
    avgElasticity: 5.2,
    promoResponse: "Medium",
    avgRiskLevel: "Medium"
  },
  {
    name: "Home & Garden",
    avgElasticity: 3.9,
    promoResponse: "Low",
    avgRiskLevel: "Low"
  },
  {
    name: "Sports & Outdoors",
    avgElasticity: 6.1,
    promoResponse: "Medium",
    avgRiskLevel: "Medium"
  }
];