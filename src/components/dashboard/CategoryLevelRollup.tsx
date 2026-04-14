import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PriceRecord, AvailabilityRecord } from "@/data/dataLoader";

interface CategoryLevelRollupProps {
  priceData?: PriceRecord[];
  availData?: AvailabilityRecord[];
}

export const CategoryLevelRollup = ({ priceData = [], availData = [] }: CategoryLevelRollupProps) => {
  const rollup = useMemo(() => {
    // Avg discount per category (proxy for promo response)
    const discountMap: Record<string, { sum: number; count: number }> = {};
    for (const row of priceData) {
      if (!discountMap[row.category]) discountMap[row.category] = { sum: 0, count: 0 };
      discountMap[row.category].sum += row.discount_percent;
      discountMap[row.category].count++;
    }

    // Avg availability per category
    const availMap: Record<string, { sum: number; count: number }> = {};
    for (const row of availData) {
      if (!availMap[row.category]) availMap[row.category] = { sum: 0, count: 0 };
      availMap[row.category].sum += row.availability_flag;
      availMap[row.category].count++;
    }

    const categories = Array.from(
      new Set([...Object.keys(discountMap), ...Object.keys(availMap)])
    ).sort();

    return categories.map((cat) => {
      const discInfo = discountMap[cat];
      const avgDiscount = discInfo ? discInfo.sum / discInfo.count : 0;

      const availInfo = availMap[cat];
      const availRate = availInfo ? (availInfo.sum / availInfo.count) * 100 : 0;

      // Demand index: inverse of availability drop + discount activity (0-10 scale)
      const demandIndex = parseFloat(
        Math.min(10, ((100 - availRate) * 0.1 + avgDiscount * 0.1)).toFixed(1)
      );

      const promoResponse: "High" | "Medium" | "Low" =
        avgDiscount >= 12 ? "High" : avgDiscount >= 6 ? "Medium" : "Low";

      const riskLevel: "High" | "Medium" | "Low" =
        availRate < 85 ? "High" : availRate < 92 ? "Medium" : "Low";

      return { name: cat, demandIndex, promoResponse, avgRiskLevel: riskLevel, availRate, avgDiscount };
    });
  }, [priceData, availData]);

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "High": return "destructive" as const;
      case "Medium": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const getDemandColor = (score: number) => {
    if (score > 7) return "text-status-high";
    if (score >= 4) return "text-status-medium";
    return "text-muted-foreground";
  };

  const getPromoColor = (r: string) => {
    if (r === "High") return "text-status-high";
    if (r === "Medium") return "text-status-medium";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Intelligence Rollup</CardTitle>
        <CardDescription>
          Demand sensitivity, promo responsiveness, and risk by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Demand Index</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Promo Response</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {rollup.map((category) => (
                <tr key={category.name} className="border-b border-border last:border-b-0">
                  <td className="py-3 px-2 font-medium text-sm">{category.name}</td>
                  <td className="py-3 px-2">
                    <span className={`font-semibold ${getDemandColor(category.demandIndex)}`}>
                      {category.demandIndex.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-sm font-medium ${getPromoColor(category.promoResponse)}`}>
                      {category.promoResponse}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={getRiskVariant(category.avgRiskLevel)} className="text-xs">
                      {category.avgRiskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
