// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceGapItem {
  sku: string;
  name: string;
  category: string;
  currentPrice: string;
  competitorAvg: string;
  gap: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  marginPercent?: number;
  elasticityScore: number;
  promoResponse: "High" | "Medium" | "Low";
}

interface TopRiskSKUsProps {
  skus: PriceGapItem[];
}

export function TopRiskSKUs({ skus }: TopRiskSKUsProps) {
  const getRiskColor = (riskLevel: PriceGapItem["riskLevel"]) => {
    switch (riskLevel) {
      case "Critical":
        return "text-status-critical bg-status-critical/10 border-status-critical/20";
      case "High":
        return "text-status-high bg-status-high/10 border-status-high/20";
      case "Medium":
        return "text-status-medium bg-status-medium/10 border-status-medium/20";
      default:
        return "text-status-low bg-status-low/10 border-status-low/20";
    }
  };

  const getRiskBadgeVariant = (riskLevel: PriceGapItem["riskLevel"]) => {
    switch (riskLevel) {
      case "Critical":
      case "High":
        return "destructive" as const;
      case "Medium":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top Price Gap Items</CardTitle>
          <Button variant="outline" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {skus.map((item, index) => (
            <div
              key={item.sku}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                getRiskColor(item.riskLevel)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <Badge variant={getRiskBadgeVariant(item.riskLevel)} className="text-xs">
                  {item.riskLevel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">SKU</div>
                  <div className="font-mono">{item.sku}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div>{item.category}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Price (Platform)</div>
                  <div className="font-medium">{item.currentPrice}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Competitor Avg</div>
                  <div className="font-medium">{item.competitorAvg}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Price Gap: </span>
                  <span
                    className={cn(
                      "font-medium",
                      item.gap.startsWith("+") ? "text-status-high" : "text-status-low"
                    )}
                  >
                    {item.gap}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
