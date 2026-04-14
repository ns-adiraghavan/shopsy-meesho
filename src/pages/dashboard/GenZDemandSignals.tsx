import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { datasets } from "@/data/dataLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function scoreColor(score: number): string {
  if (score > 85) return "hsl(0, 72%, 51%)";
  if (score > 70) return "hsl(38, 92%, 50%)";
  return "hsl(var(--muted-foreground))";
}

function scoreBadge(score: number) {
  if (score >= 85) return <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0 font-medium">🔥 Trending</span>;
  if (score >= 70) return <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-1.5 py-0 font-medium">↑ Rising</span>;
  if (score >= 55) return <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-600 border border-violet-200 text-[10px] px-1.5 py-0 font-medium">Emerging</span>;
  return <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border text-[10px] px-1.5 py-0 font-medium">Watching</span>;
}

function delta(val: number) {
  if (val > 0) return <span className="text-emerald-600 dark:text-emerald-400">+{val.toFixed(1)}</span>;
  if (val < 0) return <span className="text-red-600 dark:text-red-400">{val.toFixed(1)}</span>;
  return <span className="text-muted-foreground">0</span>;
}

/* ------------------------------------------------------------------ */
/*  KPI card                                                          */
/* ------------------------------------------------------------------ */

function KPISimple({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: "red" | "green" | "amber" }) {
  const border = color === "red"
    ? "border-l-4 border-l-red-500"
    : color === "green"
      ? "border-l-4 border-l-emerald-500"
      : color === "amber"
        ? "border-l-4 border-l-amber-500"
        : "border-l-4 border-l-border";
  return (
    <Card className={cn("bg-gradient-card", border)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function GenZDemandSignals() {
  /* ---------- base data ---------- */

  const LATEST_DATE = useMemo(() => datasets.genzTraction.reduce((max, r) => r.date > max ? r.date : max, ""), []);

  const meeshoGenz = useMemo(
    () => datasets.genzTraction.filter((r) => r.platform === "Meesho" && r.date.slice(0, 10) === LATEST_DATE.slice(0, 10)),
    [LATEST_DATE]
  );

  const skuNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.skuMaster.forEach((s) => { m[s.sku_id] = s.normalized_name; });
    return m;
  }, []);

  const shopsyListedSet = useMemo(() => {
    const s = new Set<string>();
    datasets.assortmentTracking
      .filter((r) => r.platform === "Shopsy" && r.listing_status === 1)
      .forEach((r) => s.add(r.sku_id));
    return s;
  }, []);

  const shopsyPromoMap = useMemo(() => {
    const m: Record<string, number> = {};
    datasets.priceTracking
      .filter((r) => r.platform === "Shopsy" && r.date.slice(0, 10) === LATEST_DATE.slice(0, 10))
      .forEach((r) => { m[r.sku_id] = r.promotion_flag; });
    return m;
  }, [LATEST_DATE]);

  const shopsyGapMap = useMemo(() => {
    const m: Record<string, number> = {};
    datasets.priceTracking
      .filter((r) => r.platform === "Shopsy" && r.date.slice(0, 10) === LATEST_DATE.slice(0, 10))
      .forEach((r) => { m[r.sku_id] = r.price_gap_pct; });
    return m;
  }, [LATEST_DATE]);

  /* ---------- Section 1 — KPIs ---------- */

  const trendingCount = useMemo(() => meeshoGenz.filter((r) => r.genz_traction_score > 70).length, [meeshoGenz]);
  const hotCount = useMemo(() => meeshoGenz.filter((r) => r.genz_traction_score > 85).length, [meeshoGenz]);
  const avgScore = useMemo(() => avg(meeshoGenz.map((r) => r.genz_traction_score)), [meeshoGenz]);
  const genzKeywordCount = useMemo(() => {
    const s = new Set<string>();
    datasets.searchRankTracking
      .filter((r) => r.keyword_genz_flag === 1)
      .forEach((r) => s.add(r.keyword));
    return s.size;
  }, []);

  /* ---------- Section 2 — Leaderboard ---------- */

  const leaderboard = useMemo(() => {
    return [...meeshoGenz]
      .sort((a, b) => b.genz_traction_score - a.genz_traction_score)
      .slice(0, 20)
      .map((r, i) => ({
        rank: i + 1,
        sku_id: r.sku_id,
        name: skuNameMap[r.sku_id] || r.sku_id,
        brand: r.brand,
        category: r.category,
        score: r.genz_traction_score,
        keywordCoverage: r.genz_keyword_coverage,
        reviewDelta: r.review_count_delta,
        ratingDelta: r.rating_delta,
        shopsyListed: shopsyListedSet.has(r.sku_id),
      }));
  }, [meeshoGenz, skuNameMap, shopsyListedSet]);

  /* ---------- Section 3 — Category chart ---------- */

  const categoryScoreData = useMemo(() => {
    const map: Record<string, number[]> = {};
    meeshoGenz.forEach((r) => {
      (map[r.category] ??= []).push(r.genz_traction_score);
    });
    return Object.entries(map)
      .map(([category, scores]) => ({ category, score: +avg(scores).toFixed(1) }))
      .sort((a, b) => b.score - a.score);
  }, [meeshoGenz]);

  /* ---------- Section 4 — Keyword Rank Comparison ---------- */

  const keywordComparison = useMemo(() => {
    const latest = datasets.searchRankTracking.filter(
      (r) => r.date.slice(0, 10) === LATEST_DATE.slice(0, 10) && r.keyword_genz_flag === 1
    );
    const map: Record<string, { shopsy: number[]; meesho: number[] }> = {};
    latest.forEach((r) => {
      const entry = (map[r.keyword] ??= { shopsy: [], meesho: [] });
      if (r.platform === "Shopsy") entry.shopsy.push(r.search_rank);
      if (r.platform === "Meesho") entry.meesho.push(r.search_rank);
    });
    return Object.entries(map)
      .map(([keyword, v]) => ({
        keyword: keyword.length > 18 ? keyword.slice(0, 16) + "\u2026" : keyword,
        Shopsy: v.shopsy.length ? +avg(v.shopsy).toFixed(1) : null,
        Meesho: v.meesho.length ? +avg(v.meesho).toFixed(1) : null,
      }))
      .filter((r) => r.Shopsy !== null || r.Meesho !== null)
      .sort((a, b) => (a.Meesho ?? 99) - (b.Meesho ?? 99))
      .slice(0, 15);
  }, [LATEST_DATE]);

  // Meesho win rate in top 10
  const meeshoWinRate = useMemo(() => {
    const latest = datasets.searchRankTracking.filter(
      (r) => r.date === LATEST_DATE && r.keyword_genz_flag === 1 && r.top10_flag === 1
    );
    const meeshoSlots = latest.filter((r) => r.platform === "Meesho").length;
    const total = latest.length;
    return total > 0 ? Math.round((meeshoSlots / total) * 100) : 0;
  }, [LATEST_DATE]);

  /* ---------- Section 5 — Response Gap ---------- */

  const responseGap = useMemo(() => {
    return meeshoGenz
      .filter((r) => r.genz_traction_score > 65)
      .map((r) => {
        const listed = shopsyListedSet.has(r.sku_id);
        const promoting = shopsyPromoMap[r.sku_id] === 1;
        const gap = shopsyGapMap[r.sku_id];
        // Show if: not listed, or listed but not promoting
        if (listed && promoting) return null;
        return {
          sku_id: r.sku_id,
          name: skuNameMap[r.sku_id] || r.sku_id,
          brand: r.brand,
          category: r.category,
          score: r.genz_traction_score,
          priceGap: gap ?? null,
          action: !listed ? "Quick-Add Candidate" : "Promote Now",
          actionVariant: (!listed ? "destructive" : "default") as "destructive" | "default",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as Array<{
        sku_id: string; name: string; brand: string; category: string;
        score: number; priceGap: number | null; action: string; actionVariant: "destructive" | "default";
      }>;
  }, [meeshoGenz, shopsyListedSet, shopsyPromoMap, shopsyGapMap, skuNameMap]);

  /* ---------- render ---------- */

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <h1 className="text-lg font-semibold">Gen Z Demand Signals</h1>
      <p className="text-xs text-muted-foreground -mt-4">
        Monitoring Meesho&apos;s Gen Z traction to identify Shopsy response opportunities
      </p>

      {/* Section 1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPISimple title="Trending SKUs (score > 70)" value={trendingCount.toString()} subtitle="on Meesho" color="amber" />
        <KPISimple title="Hot SKUs (score > 85)" value={hotCount.toString()} subtitle="on Meesho" color="red" />
        <KPISimple title="Avg Gen Z Traction Score" value={avgScore.toFixed(1)} subtitle="Meesho latest" />
        <KPISimple title="Gen Z Keywords Tracked" value={genzKeywordCount.toString()} color="green" />
      </div>

      {/* Section 2 — Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gen Z Traction Leaderboard (Meesho)</CardTitle>
          <p className="text-xs text-muted-foreground">Signal source: Meesho · Scores reflect Gen Z keyword rank momentum + review velocity · 14-day window</p>
          <p className="text-xs text-muted-foreground">Top 20 SKUs by Gen Z traction score, latest date</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["#", "Product", "Brand", "Category", "Gen Z Score", "Keyword Cov.", "Review Vel.", "Rating \u0394", "Shopsy Listed?"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr key={r.sku_id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 text-muted-foreground">{r.rank}</td>
                  <td className="py-1.5 px-2 max-w-[180px] truncate font-medium">{r.name}</td>
                  <td className="py-1.5 px-2">{r.brand}</td>
                  <td className="py-1.5 px-2">{r.category}</td>
                  <td className="py-1.5 px-2">{scoreBadge(r.score)}</td>
                  <td className="py-1.5 px-2">{(r.keywordCoverage * 100).toFixed(0)}%</td>
                  <td className="py-1.5 px-2">{delta(r.reviewDelta)}</td>
                  <td className="py-1.5 px-2">{delta(r.ratingDelta)}</td>
                  <td className="py-1.5 px-2 text-center">
                    {r.shopsyListed
                      ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">{"\u2713"}</span>
                      : <span className="text-red-600 dark:text-red-400 font-bold">{"\u2717"}</span>}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">No Gen Z traction data loaded.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Section 3 — Category Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gen Z Traction by Category (Meesho)</CardTitle>
          <p className="text-xs text-muted-foreground">Avg traction score by category, latest date</p>
        </CardHeader>
        <CardContent>
          {categoryScoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(280, categoryScoreData.length * 34)}>
              <BarChart data={categoryScoreData} layout="vertical" margin={{ left: 150, right: 50, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}`} fontSize={11} />
                <YAxis type="category" dataKey="category" width={140} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                <RechartsTooltip formatter={(v: number) => [v, "Avg Score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {categoryScoreData.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.score)} />
                  ))}
                  <LabelList dataKey="score" position="right" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Keyword Rank Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gen Z Keyword Rank Comparison</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">Shopsy vs Meesho avg search rank on Gen Z keywords (lower = better)</p>
            {meeshoWinRate > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Meesho wins {meeshoWinRate}% of Gen Z top-10 slots
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {keywordComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, keywordComparison.length * 28)}>
              <BarChart data={keywordComparison} layout="vertical" margin={{ left: 140, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} reversed />
                <YAxis type="category" dataKey="keyword" width={130} fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} />
                <RechartsTooltip />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No Gen Z keyword data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Response Gap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Shopsy Response Gap</CardTitle>
          <p className="text-xs text-muted-foreground">High Gen Z traction SKUs (Meesho) that Shopsy is NOT promoting</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-4">
            <span className="text-amber-500 text-lg shrink-0">⚡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Shopsy is leaving Gen Z GMV on the table</p>
              <p className="text-xs text-amber-700 mt-0.5">These SKUs have strong Gen Z pull on Meesho. Shopsy either doesn&apos;t carry them or isn&apos;t promoting them. Lowest-effort, highest-impact actions for the next campaign cycle.</p>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Product", "Brand", "Category", "Gen Z Score", "Shopsy Price Gap %", "Action"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responseGap.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No response gaps found.</td></tr>
              ) : responseGap.map((r, i) => (
                <tr key={`${r.sku_id}-${i}`} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 max-w-[180px] truncate font-medium">{r.name}</td>
                  <td className="py-1.5 px-2">{r.brand}</td>
                  <td className="py-1.5 px-2">{r.category}</td>
                  <td className="py-1.5 px-2">{scoreBadge(r.score)}</td>
                  <td className={cn("py-1.5 px-2 font-medium",
                    r.priceGap !== null && r.priceGap > 5 ? "text-red-600 dark:text-red-400" :
                    r.priceGap !== null && r.priceGap < -1 ? "text-emerald-600 dark:text-emerald-400" : ""
                  )}>
                    {r.priceGap !== null ? `${r.priceGap > 0 ? "+" : ""}${r.priceGap.toFixed(1)}%` : "\u2014"}
                  </td>
                  <td className="py-1.5 px-2">
                    {r.action === "Quick-Add Candidate" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0.5 font-medium">🏷️ Quick-Add Candidate</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200 text-[10px] px-1.5 py-0.5 font-medium">⚡ Promote Now</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
