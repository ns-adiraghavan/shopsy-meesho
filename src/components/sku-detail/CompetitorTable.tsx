import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { heatmapData } from "@/data/dashboardData";


interface CompetitorTableProps {
  skuId: string;
  category: string;
}

export function CompetitorTable({ skuId, category }: CompetitorTableProps) {
  // Find competitor data based on category
  const categoryData = heatmapData.find(
    cat => cat.category.toLowerCase().includes(category.toLowerCase().split(' ')[0])
  );

  const competitors = categoryData?.competitors || [
    { 
      name: "Amazon", 
      competitiveness: 85, 
      priceGap: -2.1,
      ourPrice: "₹49,999",
      theirPrice: "₹48,949",
      skuName: "4K UHD Smart TV 55-Inch",
      lastUpdated: "2024-01-30T14:30:00Z",
      skuCount: 423
    },
    { 
      name: "Best Buy", 
      competitiveness: 72, 
      priceGap: 5.3,
      ourPrice: "₹49,999",
      theirPrice: "₹52,649",
      skuName: "Ultra HD LED TV 55\" with HDR",
      lastUpdated: "2024-01-30T12:15:00Z",
      skuCount: 312
    },
    { 
      name: "Walmart", 
      competitiveness: 67, 
      priceGap: 8.7,
      ourPrice: "₹49,999",
      theirPrice: "₹54,349",
      skuName: "55-Inch Smart 4K Television",
      lastUpdated: "2024-01-30T16:45:00Z",
      skuCount: 287
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCompetitorSkuName = (_compName: string) => undefined;

  const getGapColor = (gap: number) => {
    if (gap < -5) return "text-green-600";
    if (gap < 0) return "text-green-500";
    if (gap < 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIndicator = (gap: number) => {
    const isSignificant = Math.abs(gap) > 5;
    
    if (gap < 0) {
      // Our price is lower (good)
      return (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          {isSignificant && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
        </div>
      );
    } else {
      // Our price is higher (bad)
      return (
        <div className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-red-600" />
          {isSignificant && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
        </div>
      );
    }
  };

  const getCompetitivenessVariant = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "secondary";
    return "outline";
  };

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Competitor Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Their Price</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Competitor SKU Name
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Competitors may describe the same product differently</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor, index) => (
                <TableRow key={index} className="transition-all duration-150 hover:bg-muted/50">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>{competitor.theirPrice}</TableCell>
                  <TableCell className="max-w-[240px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm truncate cursor-pointer">
                          {getCompetitorSkuName(competitor.name) ?? competitor.skuName ?? '—'}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {getCompetitorSkuName(competitor.name) ?? competitor.skuName ?? '—'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTrendIndicator(competitor.priceGap)}
                      <span className={`${getGapColor(competitor.priceGap)} font-medium`}>
                        {competitor.priceGap > 0 ? '+' : ''}{competitor.priceGap.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCompetitivenessVariant(competitor.competitiveness)}>
                      {competitor.competitiveness}/100
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatLastUpdated(competitor.lastUpdated)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Score: Competitiveness rating based on price, availability, and market position</p>
        </div>
      </CardContent>
    </Card>
  );
}