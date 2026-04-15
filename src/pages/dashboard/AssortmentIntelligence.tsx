import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { datasets } from "@/data/dataLoader";
import { chartTooltipProps } from "@/lib/chartStyles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";

const LATEST_DATE = "2026-04-14";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function KPISimple({ title, value, subtitle, color, tooltip }: { title: string; value: string; subtitle?: string; color?: "red" | "green" | "amber"; tooltip?: string }) {
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
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {title}
          {tooltip && (
            <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100" /></TooltipTrigger><TooltipContent className="max-w-xs text-xs"><p>{tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function AssortmentIntelligence() {
  /* ---------- base lookups ---------- */

  const skuNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.skuMaster.forEach((s) => { m[s.sku_id] = s.normalized_name; });
    return m;
  }, []);

  const meeshoListedSet = useMemo(() => {
    const s = new Set<string>();
    datasets.assortmentTracking.filter((r) => r.platform === "Meesho" && r.listing_status === 1).forEach((r) => s.add(r.sku_id));
    return s;
  }, []);

  const shopsyListedSet = useMemo(() => {
    const s = new Set<string>();
    datasets.assortmentTracking.filter((r) => r.platform === "Shopsy" && r.listing_status === 1).forEach((r) => s.add(r.sku_id));
    return s;
  }, []);

  const genzScoreMap = useMemo(() => {
    const m: Record<string, number> = {};
    datasets.genzTraction
      .filter((r) => r.platform === "Meesho" && r.date === LATEST_DATE)
      .forEach((r) => { m[r.sku_id] = r.genz_traction_score; });
    return m;
  }, []);

  const meeshoPromoMap = useMemo(() => {
    const m: Record<string, { flag: number; discount: number }> = {};
    datasets.priceTracking
      .filter((r) => r.platform === "Meesho" && r.date === LATEST_DATE)
      .forEach((r) => { m[r.sku_id] = { flag: r.promotion_flag, discount: r.discount_percent }; });
    return m;
  }, []);

  const shopsyPromoMap = useMemo(() => {
    const m: Record<string, { flag: number; discount: number }> = {};
    datasets.priceTracking
      .filter((r) => r.platform === "Shopsy" && r.date === LATEST_DATE)
      .forEach((r) => { m[r.sku_id] = { flag: r.promotion_flag, discount: r.discount_percent }; });
    return m;
  }, []);

  /* ---------- Section 1 — KPIs ---------- */

  const totalSKUs = datasets.skuMaster.length;
  const meeshoListedCount = meeshoListedSet.size;
  const shopsyListedCount = shopsyListedSet.size;
  const assortmentGapCount = useMemo(() => {
    let count = 0;
    meeshoListedSet.forEach((id) => { if (!shopsyListedSet.has(id)) count++; });
    return count;
  }, [meeshoListedSet, shopsyListedSet]);

  /* ---------- Section 2 — Brand Penetration ---------- */

  const brandPenetrationData = useMemo(() => {
    const groups: Record<string, { shopsy: number[]; meesho: number[] }> = {
      National: { shopsy: [], meesho: [] },
      "Meesho-Leaning": { shopsy: [], meesho: [] },
      "Shopsy-Exclusive": { shopsy: [], meesho: [] },
    };
    const affinityLabel = (a: string) => {
      if (a === "national") return "National";
      if (a === "meesho") return "Meesho-Leaning";
      return "Shopsy-Exclusive";
    };
    datasets.assortmentTracking.forEach((r) => {
      const label = affinityLabel(r.brand_affinity);
      const group = groups[label];
      if (!group) return;
      if (r.platform === "Shopsy") group.shopsy.push(r.listing_status);
      if (r.platform === "Meesho") group.meesho.push(r.listing_status);
    });
    return Object.entries(groups).map(([name, v]) => ({
      group: name,
      Shopsy: +(avg(v.shopsy) * 100).toFixed(1),
      Meesho: +(avg(v.meesho) * 100).toFixed(1),
    }));
  }, []);

  /* ---------- Section 3 — Gap Priority List ---------- */

  const gapPriorityList = useMemo(() => {
    const rows: Array<{ sku_id: string; name: string; brand: string; affinity: string; category: string; genzScore: number }> = [];
    meeshoListedSet.forEach((id) => {
      if (shopsyListedSet.has(id)) return;
      const master = datasets.skuMaster.find((s) => s.sku_id === id);
      rows.push({
        sku_id: id,
        name: skuNameMap[id] || id,
        brand: master?.brand || "",
        affinity: master?.brand_affinity || "",
        category: master?.category || "",
        genzScore: genzScoreMap[id] ?? 0,
      });
    });
    return rows.sort((a, b) => b.genzScore - a.genzScore);
  }, [meeshoListedSet, shopsyListedSet, skuNameMap, genzScoreMap]);

  /* ---------- Section 5 — Category Depth ---------- */

  const categoryDepthData = useMemo(() => {
    const map: Record<string, { shopsy: Set<string>; meesho: Set<string> }> = {};
    datasets.assortmentTracking
      .filter((r) => r.listing_status === 1)
      .forEach((r) => {
        const entry = (map[r.category] ??= { shopsy: new Set(), meesho: new Set() });
        if (r.platform === "Shopsy") entry.shopsy.add(r.sku_id);
        if (r.platform === "Meesho") entry.meesho.add(r.sku_id);
      });
    return Object.entries(map)
      .map(([category, v]) => ({ category, Shopsy: v.shopsy.size, Meesho: v.meesho.size }))
      .sort((a, b) => b.Meesho - a.Meesho);
  }, []);

  /* ---------- render ---------- */

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <h1 className="text-lg font-semibold">Assortment Intelligence</h1>

      {/* Section 1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPISimple title="Total SKUs Tracked" value={totalSKUs.toString()} tooltip="Total number of unique SKUs in the master catalogue being monitored across both platforms" />
        <KPISimple title="Meesho Listed" value={meeshoListedCount.toString()} color="amber" tooltip="SKUs currently listed and active on Meesho" />
        <KPISimple title="Shopsy Listed" value={shopsyListedCount.toString()} color="green" tooltip="SKUs currently listed and active on Shopsy" />
        <KPISimple title="Assortment Gap (Meesho-only)" value={assortmentGapCount.toString()} subtitle="SKUs on Meesho but not Shopsy" color="red" tooltip="Number of SKUs that are listed on Meesho but missing from Shopsy's catalogue — potential quick-add opportunities" />
      </div>

      {/* Section 2 — Brand Penetration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Brand Penetration by Affinity</CardTitle>
          <p className="text-xs text-muted-foreground">Listing rate (%) on each platform, grouped by brand affinity</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={brandPenetrationData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="group" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
              <YAxis tickFormatter={(v: number) => `${v}%`} fontSize={11} domain={[0, 100]} />
              <RechartsTooltip {...chartTooltipProps} formatter={(v: number) => [`${v}%`, ""]} />
              <Legend verticalAlign="top" height={28} />
              <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Shopsy" position="top" fontSize={10} formatter={(v: number) => `${v}%`} />
              </Bar>
              <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Meesho" position="top" fontSize={10} formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 3 — Gap Priority */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Assortment Gap Priority List</CardTitle>
          <p className="text-xs text-muted-foreground">SKUs listed on Meesho but missing from Shopsy, ranked by Gen Z traction</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Product Name", "Brand", "Brand Affinity", "Category", "Gen Z Score", "Priority"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gapPriorityList.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No assortment gaps found.</td></tr>
              ) : gapPriorityList.slice(0, 30).map((r, i) => (
                <tr key={`${r.sku_id}-${i}`} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 max-w-[200px] truncate font-medium">{r.name}</td>
                  <td className="py-1.5 px-2">{r.brand}</td>
                  <td className="py-1.5 px-2 capitalize">{r.affinity}</td>
                  <td className="py-1.5 px-2">{r.category}</td>
                  <td className="py-1.5 px-2 font-medium tabular-nums">{r.genzScore > 0 ? r.genzScore.toFixed(1) : "\u2014"}</td>
                  <td className="py-1.5 px-2">
                    {r.genzScore > 65 ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">High Priority</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Standard</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Category Depth */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Assortment Depth</CardTitle>
          <p className="text-xs text-muted-foreground">Distinct listed SKUs per category, Shopsy vs Meesho</p>
        </CardHeader>
        <CardContent>
          {categoryDepthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, categoryDepthData.length * 34)}>
              <BarChart data={categoryDepthData} layout="vertical" margin={{ left: 150, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="category" width={140} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                <RechartsTooltip {...chartTooltipProps} />
                <Legend verticalAlign="top" height={28} />
                <Bar dataKey="Shopsy" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Meesho" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No assortment data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
