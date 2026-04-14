// @ts-nocheck
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { datasets, type GlobalFilters, applyFilters } from "@/data/dataLoader";


interface Props {
  filters: GlobalFilters;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmt = (v: number) => v.toFixed(1);


export function CompetitiveSearchAdvantage({ filters }: Props) {
  const searchData = useMemo(() => applyFilters(datasets.searchRankTracking, filters), [filters]);

  // ── 1. Platform Search Advantage Score ──────────────────────────────────
  const platformScores = useMemo(() => {
    const acc: Record<string, { elite: number[]; top10: number[]; top20: number[] }> = {};
    for (const row of searchData) {
      if (!acc[row.platform]) acc[row.platform] = { elite: [], top10: [], top20: [] };
      acc[row.platform].elite.push(row.elite_rank_flag ?? (row.search_rank <= 3 ? 1 : 0));
      acc[row.platform].top10.push(row.top10_flag  ?? (row.search_rank <= 10 ? 1 : 0));
      acc[row.platform].top20.push(row.top20_flag  ?? (row.search_rank <= 20 ? 1 : 0));
    }
    return Object.entries(acc)
      .map(([platform, d]) => {
        const elite  = avg(d.elite);
        const top10  = avg(d.top10);
        const top20  = avg(d.top20);
        const score  = elite * 0.5 + top10 * 0.3 + top20 * 0.2;
        return { platform, elite, top10, top20, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [searchData]);

  // ── 2. Category Visibility Gap ─────────────────────────────────────────
  const categoryGap = useMemo(() => {
    // group: category → platform → top10 rows / total rows
    const acc: Record<string, Record<string, { top10: number; total: number }>> = {};
    for (const row of searchData) {
      const cat = row.category;
      const plt = row.platform;
      if (!acc[cat]) acc[cat] = {};
      if (!acc[cat][plt]) acc[cat][plt] = { top10: 0, total: 0 };
      acc[cat][plt].total += 1;
      if ((row.top10_flag ?? (row.search_rank <= 10 ? 1 : 0)) === 1) acc[cat][plt].top10 += 1;
    }
    return Object.entries(acc)
      .map(([category, platforms]) => {
        const ranked = Object.entries(platforms)
          .map(([platform, { top10, total }]) => ({ platform, share: total > 0 ? (top10 / total) * 100 : 0 }))
          .sort((a, b) => b.share - a.share);
        const leader   = ranked[0];
        const second   = ranked[1];
        const gap      = leader && second ? leader.share - second.share : 0;
        return { category, leader: leader?.platform ?? "—", leaderShare: leader?.share ?? 0, gap };
      })
      .filter((r) => r.leaderShare > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8);
  }, [searchData]);

  // ── 3. Sponsored Influence ─────────────────────────────────────────────

  // ── 4. Sponsored Influence ─────────────────────────────────────────────
  const sponsoredInsights = useMemo(() => {
    const acc: Record<string, { sponsored: number[]; elite: number[] }> = {};
    for (const row of searchData) {
      if (!acc[row.platform]) acc[row.platform] = { sponsored: [], elite: [] };
      acc[row.platform].sponsored.push(row.sponsored_flag);
      acc[row.platform].elite.push(row.elite_rank_flag ?? (row.search_rank <= 3 ? 1 : 0));
    }
    return Object.entries(acc).map(([platform, d]) => {
      const sponsoredShare = avg(d.sponsored) * 100;
      const eliteShare     = avg(d.elite)     * 100;
      const monetized      = sponsoredShare > 15;
      const organicWeak    = eliteShare < sponsoredShare;
      return { platform, sponsoredShare, eliteShare, monetized, organicWeak };
    }).sort((a, b) => b.sponsoredShare - a.sponsoredShare);
  }, [searchData]);

  if (searchData.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Competitive Search Advantage
      </h2>

      {/* ── 1. Platform Search Advantage Score ── */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Platform Search Advantage Score
          </CardTitle>
          <CardDescription>Composite visibility score: Elite×0.5 + Top10×0.3 + Top20×0.2</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Rank</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Platform</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Top-3 Search Share</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Top-10 Presence</th>
                  <th className="py-2 font-medium text-muted-foreground text-right">Advantage Score</th>
                </tr>
              </thead>
              <tbody>
                {platformScores.map((row, i) => (
                  <tr key={row.platform} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                        i === 0 ? "bg-status-low/20 text-status-low" :
                        i === 1 ? "bg-status-medium/20 text-status-medium" :
                        "bg-muted text-muted-foreground"
                      )}>{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{row.platform}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{pct(row.elite)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{pct(row.top10)}</td>
                    <td className="py-2.5 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 font-bold tabular-nums px-2 py-0.5 rounded-md text-xs",
                        i === 0 ? "bg-status-low/15 text-status-low" :
                        i === 1 ? "bg-status-medium/15 text-status-medium" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {i === 0 ? <TrendingUp className="h-3 w-3" /> : i === platformScores.length - 1 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {fmt(row.score * 100)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Category Visibility Gap ── */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-status-medium" />
            Category Visibility Gap
          </CardTitle>
          <CardDescription>Top-10 search leader per category and the gap over the second platform</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryGap.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Category</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Leader</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Leader Share</th>
                    <th className="py-2 font-medium text-muted-foreground text-right">Gap vs #2</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryGap.map((row) => (
                    <tr key={row.category} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{row.category}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">{row.leader}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{row.leaderShare.toFixed(1)}%</td>
                      <td className="py-2.5 text-right">
                        <span className={cn(
                          "font-semibold tabular-nums text-xs px-2 py-0.5 rounded-md",
                          row.gap > 10 ? "bg-status-low/15 text-status-low" :
                          row.gap > 5  ? "bg-status-medium/15 text-status-medium" :
                          "bg-muted text-muted-foreground"
                        )}>
                          +{row.gap.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Keyword Competition Heatmap ── */}
      {/* ── 3. Sponsored Influence Indicator ── */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-medium" />
            Sponsored Influence Indicator
          </CardTitle>
          <CardDescription>Signals whether paid placement dominates visibility on each platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sponsoredInsights.map((row) => (
              <div key={row.platform} className={cn(
                "rounded-lg border p-3 space-y-2 transition-all",
                row.monetized ? "border-status-high/30 bg-status-high/5" : "border-border/60 bg-muted/10"
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{row.platform}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {row.monetized && (
                      <Badge className="text-xs bg-status-high/15 text-status-high border-status-high/30 hover:bg-status-high/20">
                        Search heavily monetized
                      </Badge>
                    )}
                    {row.organicWeak && (
                      <Badge className="text-xs bg-status-medium/15 text-status-medium border-status-medium/30 hover:bg-status-medium/20">
                        Organic leadership weak
                      </Badge>
                    )}
                    {!row.monetized && !row.organicWeak && (
                      <Badge variant="outline" className="text-xs text-status-low border-status-low/30">
                        Organic dominant
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Sponsored: <strong className="text-foreground">{row.sponsoredShare.toFixed(1)}%</strong></span>
                  <span>Top-3 Search Share: <strong className="text-foreground">{row.eliteShare.toFixed(1)}%</strong></span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                  <div className="bg-status-high h-full transition-all" style={{ width: `${Math.min(row.sponsoredShare, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
