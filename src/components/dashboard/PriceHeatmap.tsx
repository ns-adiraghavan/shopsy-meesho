// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapData {
  category: string;
  competitors: {
    name: string;
    competitiveness: number; // 0-100 scale
    priceGap: number; // percentage
    ourPrice: string;
    theirPrice: string;
    lastUpdated: string;
    skuCount: number;
  }[];
}

interface PriceHeatmapProps {
  data: HeatmapData[];
}

export function PriceHeatmap({ data }: PriceHeatmapProps) {
  const getHeatmapColor = (competitiveness: number) => {
    if (competitiveness >= 80) return 'bg-status-low';
    if (competitiveness >= 60) return 'bg-status-medium';
    if (competitiveness >= 40) return 'bg-status-high';
    return 'bg-status-critical';
  };

  const getHeatmapIntensity = (competitiveness: number) => {
    const opacity = Math.max(0.3, competitiveness / 100);
    return { opacity };
  };

  const getCompetitivenessLabel = (competitiveness: number) => {
    if (competitiveness >= 80) return 'Competitive';
    if (competitiveness >= 60) return 'Moderate';
    if (competitiveness >= 40) return 'At Risk';
    return 'Critical';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TooltipProvider>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Price Competitiveness Heatmap</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-status-low"></div>
                <span>Competitive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-status-medium"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-status-high"></div>
                <span>At Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-status-critical"></div>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 font-medium">Category</th>
                {data[0]?.competitors.map((competitor) => (
                  <th key={competitor.name} className="text-center py-2 px-4 font-medium min-w-[120px]">
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={row.category} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium">{row.category}</td>
                  {row.competitors.map((competitor, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="p-2 text-center">
                      <div className="relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`rounded-lg p-3 ${getHeatmapColor(competitor.competitiveness)} text-white font-medium transition-all hover:scale-105 cursor-pointer`}
                              style={getHeatmapIntensity(competitor.competitiveness)}
                            >
                              <div className="text-sm font-bold">{competitor.competitiveness}%</div>
                              <div className="text-xs opacity-90">
                                {competitor.priceGap > 0 ? '+' : ''}{competitor.priceGap}%
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-4 max-w-xs">
                            <div className="space-y-2">
                              <div className="font-semibold">{competitor.name} vs Us</div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Our Price:</div>
                                  <div className="font-medium">{competitor.ourPrice}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Their Price:</div>
                                  <div className="font-medium">{competitor.theirPrice}</div>
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="text-muted-foreground">Price Gap:</div>
                                <div className={`font-medium ${competitor.priceGap > 0 ? 'text-status-high' : 'text-status-low'}`}>
                                  {competitor.priceGap > 0 ? '+' : ''}{competitor.priceGap}%
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground border-t pt-2">
                                <div>SKUs: {competitor.skuCount}</div>
                                <div>Updated: {formatTimestamp(competitor.lastUpdated)}</div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 text-xs px-1 py-0"
                        >
                          {getCompetitivenessLabel(competitor.competitiveness)}
                        </Badge>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}