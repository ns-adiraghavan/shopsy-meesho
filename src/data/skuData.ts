// Enhanced SKU sample data

export interface SKUDetail {
  sku: string;
  name: string;
  category: string;
  basePrice: number;
  currentPrice: number;
  competitorPrices: {
    [competitor: string]: {
      price: number;
      lastUpdated: string;
      availability: 'in-stock' | 'limited' | 'out-of-stock';
    };
  };
  marginPercent: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  priceGapPercent: number;
  lastPriceUpdate: string;
  salesVelocity: number; // units per week
  inventoryLevel: number;
  brand: string;
}

export const skuDetails: SKUDetail[] = [
  {
    sku: "ELEC-HD-4K-55",
    name: "55\" 4K Smart TV",
    category: "Electronics",
    basePrice: 54169,
    currentPrice: 49999,
    competitorPrices: {
      "Amazon": { price: 45849, lastUpdated: "2024-01-30T14:30:00Z", availability: "in-stock" },
      "Best Buy": { price: 52499, lastUpdated: "2024-01-30T12:15:00Z", availability: "in-stock" },
      "Walmart": { price: 47519, lastUpdated: "2024-01-30T16:45:00Z", availability: "limited" },
      "Target": { price: 49179, lastUpdated: "2024-01-30T13:22:00Z", availability: "in-stock" }
    },
    marginPercent: 18.2,
    riskLevel: "Critical",
    priceGapPercent: 9.1,
    lastPriceUpdate: "2024-01-29T09:00:00Z",
    salesVelocity: 12,
    inventoryLevel: 45,
    brand: "Samsung"
  },
  {
    sku: "SPRT-RUN-SHU-M",
    name: "Men's Running Shoes",
    category: "Sports & Outdoors",
    basePrice: 12509,
    currentPrice: 10839,
    competitorPrices: {
      "Amazon": { price: 9169, lastUpdated: "2024-01-30T16:20:00Z", availability: "in-stock" },
      "Best Buy": { price: 11669, lastUpdated: "2024-01-30T10:45:00Z", availability: "out-of-stock" },
      "Walmart": { price: 10004, lastUpdated: "2024-01-30T15:55:00Z", availability: "in-stock" },
      "Target": { price: 10421, lastUpdated: "2024-01-30T12:40:00Z", availability: "in-stock" }
    },
    marginPercent: 32.5,
    riskLevel: "Critical",
    priceGapPercent: 18.2,
    lastPriceUpdate: "2024-01-28T14:30:00Z",
    salesVelocity: 28,
    inventoryLevel: 156,
    brand: "Nike"
  },
  {
    sku: "HOME-VAC-CORD",
    name: "Cordless Vacuum",
    category: "Home & Garden",
    basePrice: 23339,
    currentPrice: 20849,
    competitorPrices: {
      "Amazon": { price: 18349, lastUpdated: "2024-01-30T15:10:00Z", availability: "in-stock" },
      "Best Buy": { price: 22509, lastUpdated: "2024-01-30T11:30:00Z", availability: "in-stock" },
      "Walmart": { price: 19179, lastUpdated: "2024-01-30T17:05:00Z", availability: "in-stock" },
      "Target": { price: 20009, lastUpdated: "2024-01-30T14:18:00Z", availability: "limited" }
    },
    marginPercent: 28.4,
    riskLevel: "High",
    priceGapPercent: 13.6,
    lastPriceUpdate: "2024-01-29T16:15:00Z",
    salesVelocity: 15,
    inventoryLevel: 89,
    brand: "Dyson"
  },
  {
    sku: "CLTH-JNS-DNM-32",
    name: "Denim Jeans 32\"",
    category: "Clothing",
    basePrice: 7504,
    currentPrice: 6669,
    competitorPrices: {
      "Amazon": { price: 5834, lastUpdated: "2024-01-30T13:55:00Z", availability: "in-stock" },
      "Best Buy": { price: 7504, lastUpdated: "2024-01-30T09:30:00Z", availability: "out-of-stock" },
      "Walmart": { price: 6251, lastUpdated: "2024-01-30T16:10:00Z", availability: "in-stock" },
      "Target": { price: 6084, lastUpdated: "2024-01-30T14:35:00Z", availability: "in-stock" }
    },
    marginPercent: 42.1,
    riskLevel: "High",
    priceGapPercent: 14.3,
    lastPriceUpdate: "2024-01-30T08:00:00Z",
    salesVelocity: 34,
    inventoryLevel: 234,
    brand: "Levi's"
  },
  {
    sku: "HLTH-VIT-MULT",
    name: "Multivitamin 100ct",
    category: "Health & Beauty",
    basePrice: 2501,
    currentPrice: 2084,
    competitorPrices: {
      "Amazon": { price: 1834, lastUpdated: "2024-01-30T17:25:00Z", availability: "in-stock" },
      "Best Buy": { price: 2334, lastUpdated: "2024-01-30T11:45:00Z", availability: "in-stock" },
      "Walmart": { price: 1876, lastUpdated: "2024-01-30T15:30:00Z", availability: "in-stock" },
      "Target": { price: 2001, lastUpdated: "2024-01-30T13:10:00Z", availability: "in-stock" }
    },
    marginPercent: 35.7,
    riskLevel: "Medium",
    priceGapPercent: 13.6,
    lastPriceUpdate: "2024-01-29T12:00:00Z",
    salesVelocity: 67,
    inventoryLevel: 456,
    brand: "Nature Made"
  },
  {
    sku: "ELEC-HD-TAB-10",
    name: "10\" Tablet",
    category: "Electronics",
    basePrice: 29179,
    currentPrice: 27509,
    competitorPrices: {
      "Amazon": { price: 26676, lastUpdated: "2024-01-30T14:45:00Z", availability: "in-stock" },
      "Best Buy": { price: 28343, lastUpdated: "2024-01-30T12:30:00Z", availability: "in-stock" },
      "Walmart": { price: 27092, lastUpdated: "2024-01-30T16:20:00Z", availability: "in-stock" },
      "Target": { price: 27926, lastUpdated: "2024-01-30T13:40:00Z", availability: "limited" }
    },
    marginPercent: 22.1,
    riskLevel: "Medium",
    priceGapPercent: 3.1,
    lastPriceUpdate: "2024-01-30T10:15:00Z",
    salesVelocity: 18,
    inventoryLevel: 78,
    brand: "Apple"
  },
  {
    sku: "SPRT-FIT-TRK-GPS",
    name: "GPS Fitness Tracker",
    category: "Sports & Outdoors",
    basePrice: 16676,
    currentPrice: 15009,
    competitorPrices: {
      "Amazon": { price: 14176, lastUpdated: "2024-01-30T16:50:00Z", availability: "in-stock" },
      "Best Buy": { price: 15843, lastUpdated: "2024-01-30T11:20:00Z", availability: "in-stock" },
      "Walmart": { price: 14593, lastUpdated: "2024-01-30T15:40:00Z", availability: "in-stock" },
      "Target": { price: 14843, lastUpdated: "2024-01-30T12:55:00Z", availability: "in-stock" }
    },
    marginPercent: 28.9,
    riskLevel: "Medium",
    priceGapPercent: 5.9,
    lastPriceUpdate: "2024-01-29T15:30:00Z",
    salesVelocity: 22,
    inventoryLevel: 112,
    brand: "Garmin"
  },
  {
    sku: "HOME-COF-MAK-12",
    name: "12-Cup Coffee Maker",
    category: "Home & Garden",
    basePrice: 12509,
    currentPrice: 10839,
    competitorPrices: {
      "Amazon": { price: 10004, lastUpdated: "2024-01-30T15:25:00Z", availability: "in-stock" },
      "Best Buy": { price: 11669, lastUpdated: "2024-01-30T11:40:00Z", availability: "in-stock" },
      "Walmart": { price: 10421, lastUpdated: "2024-01-30T17:15:00Z", availability: "in-stock" },
      "Target": { price: 10671, lastUpdated: "2024-01-30T14:25:00Z", availability: "in-stock" }
    },
    marginPercent: 31.2,
    riskLevel: "Medium",
    priceGapPercent: 8.3,
    lastPriceUpdate: "2024-01-29T13:45:00Z",
    salesVelocity: 25,
    inventoryLevel: 167,
    brand: "Cuisinart"
  },
  {
    sku: "CLTH-SWT-HOD-L",
    name: "Hooded Sweatshirt Large",
    category: "Clothing",
    basePrice: 5834,
    currentPrice: 5001,
    competitorPrices: {
      "Amazon": { price: 4584, lastUpdated: "2024-01-30T14:10:00Z", availability: "in-stock" },
      "Best Buy": { price: 5418, lastUpdated: "2024-01-30T09:50:00Z", availability: "out-of-stock" },
      "Walmart": { price: 4751, lastUpdated: "2024-01-30T16:35:00Z", availability: "in-stock" },
      "Target": { price: 4918, lastUpdated: "2024-01-30T13:20:00Z", availability: "in-stock" }
    },
    marginPercent: 38.6,
    riskLevel: "Medium",
    priceGapPercent: 9.1,
    lastPriceUpdate: "2024-01-30T07:30:00Z",
    salesVelocity: 45,
    inventoryLevel: 298,
    brand: "Champion"
  },
  {
    sku: "HLTH-SHP-LOT-16",
    name: "Body Lotion 16oz",
    category: "Health & Beauty",
    basePrice: 1667,
    currentPrice: 1501,
    competitorPrices: {
      "Amazon": { price: 1417, lastUpdated: "2024-01-30T17:40:00Z", availability: "in-stock" },
      "Best Buy": { price: 1667, lastUpdated: "2024-01-30T12:00:00Z", availability: "in-stock" },
      "Walmart": { price: 1459, lastUpdated: "2024-01-30T15:50:00Z", availability: "in-stock" },
      "Target": { price: 1501, lastUpdated: "2024-01-30T13:45:00Z", availability: "in-stock" }
    },
    marginPercent: 41.2,
    riskLevel: "Low",
    priceGapPercent: 2.9,
    lastPriceUpdate: "2024-01-29T14:20:00Z",
    salesVelocity: 89,
    inventoryLevel: 567,
    brand: "Bath & Body Works"
  }
];

export const categories = [
  "All Categories",
  "Electronics", 
  "Sports & Outdoors", 
  "Home & Garden", 
  "Clothing", 
  "Health & Beauty"
];

export const dateRanges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];