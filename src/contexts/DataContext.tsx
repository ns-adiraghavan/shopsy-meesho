import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import pako from "pako";
import {
  datasets,
  PriceRecord,
  AvailabilityRecord,
  SearchRankRecord,
  AssortmentRecord,
  SKUMaster,
  PlatformSummary,
  CompetitorEvent,
} from "@/data/dataLoader";

// ─── Dataset keys ──────────────────────────────────────────────────────────────
export type DatasetKey =
  | "price_tracking"
  | "availability_tracking"
  | "search_rank_tracking"
  | "assortment_tracking"
  | "sku_master"
  | "platform_summary"
  | "competitor_events";

// ─── Page → required datasets ─────────────────────────────────────────────────
const PAGE_DATASETS: Record<string, DatasetKey[]> = {
  "/dashboard": [
    "sku_master",
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
    "assortment_tracking",
    "platform_summary",
  ],
  "/dashboard/pricing":      ["sku_master", "price_tracking"],
  "/dashboard/search":       ["sku_master", "search_rank_tracking"],
  "/dashboard/assortment":   ["sku_master", "assortment_tracking", "availability_tracking"],
  "/dashboard/availability": ["sku_master", "availability_tracking"],
  "/dashboard/local": [
    "sku_master",
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
  ],
  "/dashboard/events": ["sku_master", "competitor_events", "platform_summary"],
};

// ─── Context ──────────────────────────────────────────────────────────────────
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

// ─── Module-level cache (persists across re-renders / route changes) ───────────
const fetchedDatasets = new Set<DatasetKey>();
const fetchPromises: Partial<Record<DatasetKey, Promise<void>>> = {};

// ─── Pincode normalizer ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizePincode = (rows: any[]) =>
  rows.map((r) => (r.pincode != null ? { ...r, pincode: String(r.pincode) } : r));

// ─── Local-only gzip loader ───────────────────────────────────────────────────
// Strategy: always fetch as ArrayBuffer and decompress with pako.
// If the dev server auto-decompresses (Content-Encoding: gzip), the buffer will
// be plain JSON bytes — pako will throw, and we fall back to a direct text parse.
// This is the only data source — no cloud / Supabase storage calls exist.
async function fetchGzip(key: DatasetKey): Promise<unknown[]> {
  const url = `/data/${key}.json.gz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[DataContext] HTTP ${res.status} loading ${url}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let text: string;
  try {
    // Primary: raw gzip bytes on disk → pako decompresses to UTF-8 string
    text = pako.inflate(bytes, { to: "string" });
  } catch {
    // Fallback: dev-server already decoded Content-Encoding: gzip, buffer is plain JSON
    text = new TextDecoder().decode(bytes);
  }

  const json = JSON.parse(text);
  if (!Array.isArray(json)) throw new Error(`[DataContext] ${key}.json.gz did not parse to an array`);
  return json;
}

// ─── Hydrate one dataset (deduplicated by promise) ────────────────────────────
function fetchAndHydrate(key: DatasetKey): Promise<void> {
  if (fetchedDatasets.has(key)) return Promise.resolve();

  if (!fetchPromises[key]) {
    fetchPromises[key] = fetchGzip(key)
      .then((raw) => {
        switch (key) {
          case "price_tracking":
            datasets.priceTracking = normalizePincode(raw) as PriceRecord[];
            break;
          case "availability_tracking":
            datasets.availabilityTracking = normalizePincode(raw) as AvailabilityRecord[];
            break;
          case "search_rank_tracking":
            datasets.searchRankTracking = normalizePincode(raw) as SearchRankRecord[];
            break;
          case "assortment_tracking":
            datasets.assortmentTracking = normalizePincode(raw) as AssortmentRecord[];
            break;
          case "sku_master":
            datasets.skuMaster = raw as SKUMaster[];
            break;
          case "platform_summary":
            datasets.platformSummary = raw as PlatformSummary[];
            break;
          case "competitor_events":
            datasets.competitorEvents = normalizePincode(raw) as CompetitorEvent[];
            break;
        }
        fetchedDatasets.add(key);
      })
      .catch((err) => {
        // Remove the cached promise so a retry is possible on next navigation
        delete (fetchPromises as Record<string, unknown>)[key];
        // Re-throw so the caller can surface the error without hanging
        throw err;
      });
  }

  return fetchPromises[key] as Promise<void>;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loaded, setLoaded]   = useState(false);
  const [errors, setErrors]   = useState<string[]>([]);
  const [loadedDatasets, setLoadedDatasets] = useState<Set<DatasetKey>>(new Set(fetchedDatasets));
  const prevPathRef = useRef<string | null>(null);

  const loadForPage = useCallback(async (pathname: string) => {
    const required = PAGE_DATASETS[pathname] ?? [];

    // Already cached — show immediately
    if (required.every((k) => fetchedDatasets.has(k))) {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    setErrors([]);

    // Fire all required fetches in parallel; collect any failures
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
    setLoaded(true); // Always unblock — partial data is better than infinite spinner
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    loadForPage(pathname);
  }, [location.pathname, loadForPage]);

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
        <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-1">
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
