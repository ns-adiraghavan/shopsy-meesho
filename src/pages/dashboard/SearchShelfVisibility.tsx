import { KPICard } from "@/components/dashboard/KPICard";
import { getSearchData, getSponsoredShareByPlatform, getTop10PresenceByPlatform, getEliteRankShareByPlatform, GlobalFilters } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";
import { CompetitiveSearchAdvantage } from "@/components/dashboard/CompetitiveSearchAdvantage";


const SearchShelfVisibility = () => {
  const filters = useOutletContext<GlobalFilters>();

  const searchData = getSearchData(filters);
  const sponsoredByPlatform = getSponsoredShareByPlatform(filters);
  const top10Presence = getTop10PresenceByPlatform(filters);
  const eliteRankShare = getEliteRankShareByPlatform(filters);

  const avgRank = searchData.length > 0 ? searchData.reduce((s, r) => s + r.search_rank, 0) / searchData.length : 0;
  const pageOneCount = searchData.filter((r) => r.search_rank <= 10).length;
  const pageOneShare = searchData.length > 0 ? (pageOneCount / searchData.length) * 100 : 0;
  const keywordCount = new Set(searchData.map((r) => r.keyword)).size;

  const kpis = [
    { title: "Avg Search Rank", value: avgRank.toFixed(1), trend: "neutral" as const, tooltip: "Avg Search Rank: Mean position across all tracked keywords and platforms. Lower is better." },
    { title: "Top-10 Presence", value: `${pageOneShare.toFixed(1)}%`, trend: pageOneShare > 40 ? ("up" as const) : ("neutral" as const), tooltip: "Top-10 Presence: % of search observations where the platform appears in the first 10 results." },
    { title: "Keywords Tracked", value: keywordCount.toLocaleString(), trend: "neutral" as const, tooltip: "Unique keywords monitored in the filtered dataset." },
    { title: "Search Observations", value: searchData.length.toLocaleString(), trend: "neutral" as const, tooltip: "Total captured search ranking observations in the selected period." },
  ];

  // ── Rank distribution ────────────────────────────────────────────────────
  const rankRaw: Record<string, { top3: number; top10: number; top20: number; total: number }> = {};
  searchData.forEach((row) => {
    if (!rankRaw[row.platform]) rankRaw[row.platform] = { top3: 0, top10: 0, top20: 0, total: 0 };
    rankRaw[row.platform].total++;
    if (row.search_rank <= 3)  rankRaw[row.platform].top3++;
    if (row.search_rank <= 10) rankRaw[row.platform].top10++;
    if (row.search_rank <= 20) rankRaw[row.platform].top20++;
  });

  const rankDistribution = Object.entries(rankRaw).map(([platform, d]) => ({
    platform,
    "Top 3":  d.total > 0 ? parseFloat(((d.top3  / d.total) * 100).toFixed(1)) : 0,
    "Top 10": d.total > 0 ? parseFloat(((d.top10 / d.total) * 100).toFixed(1)) : 0,
    "Top 20": d.total > 0 ? parseFloat(((d.top20 / d.total) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Search & Digital Shelf Visibility</h1>
          <p className="text-sm text-muted-foreground">Track search rankings, sponsored placements, and brand visibility across platforms</p>
        </div>
      </div>

      <PageControlBar exportLabel="search_rank_tracking" exportData={searchData as unknown as Record<string, unknown>[]} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {(() => {
        const searchLeader = top10Presence[0];
        const eliteLeader = eliteRankShare[0];
        const presenceSorted = [...top10Presence].sort((a, b) => b.top10_presence_pct - a.top10_presence_pct);
        const visGap = presenceSorted.length >= 2 ? presenceSorted[0].top10_presence_pct - presenceSorted[presenceSorted.length - 1].top10_presence_pct : 0;
        const gapLow = presenceSorted[presenceSorted.length - 1];
        const insights: Insight[] = [
          searchLeader
            ? { icon: "search", title: "Search Leader", body: `${searchLeader.platform} leads Top-10 Presence with ${searchLeader.top10_presence_pct}% — highest across all tracked platforms.`, type: "positive" }
            : { icon: "search", title: "Search Leader", body: "No search data available.", type: "neutral" },
          eliteLeader
            ? { icon: "target", title: "Top-3 Search Share", body: `${eliteLeader.platform} dominates Top-3 positions with ${eliteLeader.elite_rank_share_pct}% share — the strongest high-conversion placement rate.`, type: "positive" }
            : { icon: "target", title: "Top-3 Search Share", body: "No elite rank data available.", type: "neutral" },
          visGap > 0 && gapLow
            ? { icon: "chart", title: "Visibility Gap", body: `There is a ${visGap.toFixed(1)}% gap in Top-10 Presence between the best and worst platform (${gapLow.platform} at ${gapLow.top10_presence_pct}%).`, type: visGap > 10 ? "warning" : "neutral" }
            : { icon: "chart", title: "Visibility Gap", body: "Insufficient data to compute visibility gap.", type: "neutral" },
        ];
        return <StrategicInsightsPanel insights={insights} />;
      })()}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top-10 Presence by Platform</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Top-10 Presence by Platform</CardTitle>
            <CardDescription>% of search observations where the platform appeared in the first 10 results</CardDescription>
          </CardHeader>
          <CardContent>
            {top10Presence.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top10Presence} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Top-10 Presence"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="top10_presence_pct" name="Top-10 Presence %" fill="hsl(var(--status-low))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top-3 Search Share by Platform</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Top-3 Search Share by Platform</CardTitle>
            <CardDescription>% of search observations where the platform captured a top-3 position</CardDescription>
          </CardHeader>
          <CardContent>
            {eliteRankShare.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eliteRankShare} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Top-3 Search Share"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="elite_rank_share_pct" name="Top-3 Search Share %" fill="hsl(var(--status-medium))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Search Rank Distribution</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Search Rank Distribution</CardTitle>
            <CardDescription>Share of observations ranked in Top 3 / Top 10 / Top 20 per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {rankDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rankDistribution} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="Top 3"  stackId="a" fill="hsl(var(--status-low))"    radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Top 10" stackId="a" fill="hsl(var(--status-medium))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Top 20" stackId="a" fill="hsl(var(--status-high))"   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sponsored vs Organic Share</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Sponsored vs Organic Share</CardTitle>
            <CardDescription>Top-10 search results composition by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sponsoredByPlatform.map((p) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{p.platform}</span>
                    <span>{p.sponsoredShare}% sponsored</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    <div className="bg-status-high h-full" style={{ width: `${p.sponsoredShare}%` }} />
                    <div className="bg-status-low h-full flex-1" />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-high" />Sponsored</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-low" />Organic</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <CompetitiveSearchAdvantage filters={filters} />
    </div>
  );
};

export default SearchShelfVisibility;
