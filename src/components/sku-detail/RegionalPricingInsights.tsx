import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RegionalData {
  region: string;
  competitors: {
    name: string;
    price: number;
    skuName: string;
    priceGap: number;
  }[];
}

const mockRegionalData: RegionalData[] = [
  {
    region: "560001 – Bangalore",
    competitors: [
      { name: "Amazon", price: 49199, skuName: "4K Smart TV 55-Inch", priceGap: 8.1 },
      { name: "Best Buy", price: 50899, skuName: "55\" UHD TV", priceGap: 2.0 },
      { name: "Local Retailer", price: 50459, skuName: "Smart 4K TV 55", priceGap: 3.4 }
    ]
  },
  {
    region: "110001 – Delhi",
    competitors: [
      { name: "Amazon", price: 49649, skuName: "Ultra HD TV 55-Inch", priceGap: 2.3 },
      { name: "Flipkart", price: 51029, skuName: "55 Inch Smart TV", priceGap: 0.0 },
      { name: "Local Store", price: 50639, skuName: "Smart TV 55", priceGap: 1.8 }
    ]
  },
  {
    region: "400001 – Mumbai",
    competitors: [
      { name: "Amazon", price: 49999, skuName: "Smart 4K TV 55-Inch", priceGap: 1.8 },
      { name: "Croma", price: 51299, skuName: "UHD Smart TV 55\"", priceGap: -0.8 },
      { name: "Reliance Digital", price: 50329, skuName: "Smart TV 55 Inch", priceGap: 1.2 }
    ]
  }
];

interface RegionalPricingInsightsProps {
  skuId: string;
}

export function RegionalPricingInsights({ skuId }: RegionalPricingInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(mockRegionalData[0].region);

  const currentRegionData = mockRegionalData.find(data => data.region === selectedRegion);

  const getPriceGapColor = (gap: number) => {
    if (gap > 5) return "text-red-600";
    if (gap > 0) return "text-orange-600";
    if (gap === 0) return "text-gray-600";
    return "text-green-600";
  };

  const getPriceGapVariant = (gap: number) => {
    if (gap > 5) return "destructive";
    if (gap > 0) return "secondary";
    if (gap === 0) return "outline";
    return "outline";
  };

  const formatPriceGap = (gap: number) => {
    if (gap === 0) return "Same";
    return gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`;
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <Card className="border rounded-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Regional Pricing Insights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>
                Hide
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show Regional Pricing
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4 animate-fade-in">
          {/* Region Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-foreground min-w-fit">
              Select Region:
            </label>
            <Select
              value={selectedRegion}
              onValueChange={setSelectedRegion}
            >
              <SelectTrigger className="w-full sm:w-64 transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {mockRegionalData.map((data) => (
                  <SelectItem key={data.region} value={data.region}>
                    {data.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Table */}
          {currentRegionData && (
            <div className="transition-all duration-300 animate-fade-in">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Competitor</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">SKU Name</TableHead>
                      <TableHead className="font-semibold">Price Gap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRegionData.competitors.map((competitor, index) => (
                      <TableRow 
                        key={`${competitor.name}-${index}`}
                        className="hover:bg-muted/30 transition-colors duration-150"
                      >
                        <TableCell className="font-medium">
                          {competitor.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          ₹{competitor.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(competitor.skuName)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover border shadow-md">
                                <p className="text-sm">{competitor.skuName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getPriceGapVariant(competitor.priceGap)}
                              className={`${getPriceGapColor(competitor.priceGap)} text-xs`}
                            >
                              {formatPriceGap(competitor.priceGap)}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-popover border shadow-md">
                                  <p className="text-xs">
                                    {competitor.priceGap > 0 
                                      ? "Higher than our SKU price" 
                                      : competitor.priceGap < 0 
                                        ? "Lower than our SKU price"
                                        : "Same as our SKU price"
                                    }
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile SKU Names */}
              <div className="sm:hidden mt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">SKU Names:</p>
                {currentRegionData.competitors.map((competitor, index) => (
                  <div key={`mobile-${competitor.name}-${index}`} className="text-xs text-muted-foreground">
                    <span className="font-medium">{competitor.name}:</span> {competitor.skuName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}