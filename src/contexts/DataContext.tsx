/**
 * DataContext.tsx — Category-First Data Provider v2.0
 *
 * Loads datasets from /data/*.json.gz on demand, keyed by page route.
 * Uses a module-level cache so datasets survive route changes without re-fetching.
 * Pages consume data via accessor functions in dataLoader.ts — never raw JSON.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import pako from "pako";
import {
  datasets,
  CategoryMaster,
  CategoryPricing,
  CategoryAvailability,
  CategoryAssortment,
  CategorySearch,
  GenZSignal,
  DemandSignal,
  PromoCalendar,
  PromotionROI,
  CompetitorEvent,
  PlatformSummary,
  CategorySummary,
} from "@/data/dataLoader";

// ─────────────────────────────────────────────────────────────────────────────
// DATASET KEYS
// Maps 1-to-1 to filenames in public/data/*.json.gz
// ─────────────────────────────────────────────────────────────────────────────

export type DatasetKey =
  | "category_master"
  | "category_pricing"
  | "category_availability"
  | "category_assortment"
  | "category_search"
  | "genz_signals"
  | "demand_signals"
  | "promo_calendar"
  | "promotion_roi"
  | "competitor_events"
  | "platform_summary"
  | "category_summary";

// ─────────────────────────────────────────────────────────────────────────────
// PAGE → REQUIRED DATASETS
// Each page only loads what it needs. Shared datasets (master, summary)
// are requested by every page so they load on first navigation.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_DATASETS: Record<string, DatasetKey[]> = {
  "/dashboard": [
    "platform_summary",
    "category_summary",
    "competitor_events",
    "category_pricing",
    "category_master",
  ],
  "/dashboard/pricing": [
    "category_master",
    "category_pricing",
    "promo_calendar",
    "category_summary",
  ],
  "/dashboard/genz": [
    "category_master",
    "genz_signals",
    "category_search",
    "category_pricing",
  ],
  "/dashboard/assortment": [
    "category_master",
    "category_assortment",
    "genz_signals",
  ],
  "/dashboard/demand": [
    "category_master",
    "demand_signals",
    "category_availability",
    "category_pricing",
  ],
  "/dashboard/budget": [
    "category_master",
    "promotion_roi",
    "promo_calendar",
    "category_pricing",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface DataContextValue {
  loaded: boolean;
  loadedDatasets: Set<DatasetKey>;
}

const DataContext = createContext<DataContextValue>({
  loaded: false,
  loadedDatasets: new Set(),
});

export function useData() {
  return useContext(DataContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CACHE
// Persists across re-renders and route changes. A dataset is never fetched twice.
// ─────────────────────────────────────────────────────────────────────────────

const fetchedDatasets = new Set<DatasetKey>();
const fetchPromises: Partial<Record<DatasetKey, Promise<void>>> = {};

// ─────────────────────────────────────────────────────────────────────────────
// GZIP LOADER
// ─────────────────────────────────────────────────────────────────────────────

async function fetchGzip(key: DatasetKey): Promise<unknown[]> {
  const url = `/data/${key}.json.gz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[DataContext] HTTP ${res.status} — ${url}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let text: string;
  try {
    text = pako.inflate(bytes, { to: "string" });
  } catch {
    // File may not actually be gzipped — try raw decode
    text = new TextDecoder().decode(bytes);
  }

  const json = JSON.parse(text);
  if (!Array.isArray(json)) throw new Error(`[DataContext] ${key}.json.gz did not parse to an array`);
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// HYDRATE ONE DATASET
// Deduplicates concurrent requests for the same key via promise cache.
// ─────────────────────────────────────────────────────────────────────────────

function fetchAndHydrate(key: DatasetKey): Promise<void> {
  if (fetchedDatasets.has(key)) return Promise.resolve();

  if (!fetchPromises[key]) {
    fetchPromises[key] = fetchGzip(key)
      .then((raw) => {
        switch (key) {
          case "category_master":
            datasets.categoryMaster = raw as CategoryMaster[];
            break;
          case "category_pricing":
            datasets.categoryPricing = raw as CategoryPricing[];
            break;
          case "category_availability":
            datasets.categoryAvailability = raw as CategoryAvailability[];
            break;
          case "category_assortment":
            datasets.categoryAssortment = raw as CategoryAssortment[];
            break;
          case "category_search":
            datasets.categorySearch = raw as CategorySearch[];
            break;
          case "genz_signals":
            datasets.genzSignals = raw as GenZSignal[];
            break;
          case "demand_signals":
            datasets.demandSignals = raw as DemandSignal[];
            break;
          case "promo_calendar":
            datasets.promoCalendar = raw as PromoCalendar[];
            break;
          case "promotion_roi":
            datasets.promotionROI = raw as PromotionROI[];
            break;
          case "competitor_events":
            datasets.competitorEvents = raw as CompetitorEvent[];
            break;
          case "platform_summary":
            datasets.platformSummary = raw as PlatformSummary[];
            break;
          case "category_summary":
            datasets.categorySummary = raw as CategorySummary[];
            break;
        }
        fetchedDatasets.add(key);
      })
      .catch((err) => {
        // Remove promise from cache so it can be retried
        delete (fetchPromises as Record<string, unknown>)[key];
        throw err;
      });
  }

  return fetchPromises[key] as Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadedDatasets, setLoadedDatasets] = useState<Set<DatasetKey>>(
    new Set(fetchedDatasets)
  );
  const prevPathRef = useRef<string | null>(null);

  const loadForPage = useCallback(async (pathname: string) => {
    const required = PAGE_DATASETS[pathname] ?? [];

    // All already loaded — skip network entirely
    if (required.every((k) => fetchedDatasets.has(k))) {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    setErrors([]);

    const results = await Promise.allSettled(required.map((k) => fetchAndHydrate(k)));

    const failed: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.error(`[DataContext] Failed to load ${required[i]}:`, msg);
        failed.push(required[i]);
      }
    });

    setLoadedDatasets(new Set(fetchedDatasets));
    setErrors(failed);
    setLoaded(true);
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    loadForPage(pathname);
  }, [location.pathname, loadForPage]);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading intelligence data…</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ loaded, loadedDatasets }}>
      {errors.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
          {errors.map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-md"
            >
              <span className="font-semibold">⚠ Failed to load:</span>
              <code>{key}.json.gz</code>
            </div>
          ))}
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}
