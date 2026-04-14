// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, Zap } from "lucide-react";

interface SKUOverviewProps {
  skuData: any;
  adjustedPrice: number | null;
  adjustedMargin: number | null;
}

export function SKUOverview({ skuData, adjustedPrice, adjustedMargin }: SKUOverviewProps) {
  const priceGapColor = skuData.priceGap > 0 ? 'text-red-600' : 'text-green-600';
  const isAdjusted = adjustedPrice !== skuData.currentPrice || adjustedMargin !== skuData.marginPercent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          SKU Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Brand</span>
            <p className="font-medium">{skuData.brand}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{skuData.category}</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Price</span>
            <div className="text-right">
              <p className={`text-lg font-bold ${isAdjusted ? 'line-through text-muted-foreground' : ''}`}>
                ₹{skuData.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              {isAdjusted && adjustedPrice && (
                <p className="text-lg font-bold text-primary">
                  ₹{adjustedPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Competitor Average</span>
            <p className="font-medium">₹{skuData.competitorAvg.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Price Gap</span>
            <div className="flex items-center gap-1">
              {skuData.priceGap > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className={`font-medium ${priceGapColor}`}>
                {skuData.priceGap > 0 ? '+' : ''}{skuData.priceGap.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Margin */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Margin</span>
            <div className="text-right">
              <p className={`font-bold ${isAdjusted ? 'line-through text-muted-foreground' : ''}`}>
                {skuData.marginPercent.toFixed(1)}%
              </p>
              {isAdjusted && adjustedMargin && (
                <p className="font-bold text-primary">
                  {adjustedMargin.toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Cost</span>
            <p className="font-medium">₹{skuData.cost.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Inventory</span>
            <Badge variant="outline">{skuData.inventory} units</Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sales Velocity</span>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-600" />
              <Badge variant="secondary">{skuData.salesVelocity}</Badge>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Elasticity Score</span>
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className={`${
                  skuData.elasticityScore > 7 
                    ? 'text-green-600 border-green-600' 
                    : skuData.elasticityScore >= 4 
                      ? 'text-yellow-600 border-yellow-600' 
                      : 'text-gray-600 border-gray-600'
                }`}
              >
                {skuData.elasticityScore}/10
              </Badge>
            </div>
          </div>
        </div>

        {/* Impact Preview */}
        {isAdjusted && (
          <div className="bg-muted/50 rounded-lg p-3 border-t">
            <p className="text-sm font-medium text-foreground mb-2">Impact Preview</p>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Price Change:</span>
                <span className={adjustedPrice! > skuData.currentPrice ? 'text-red-600' : 'text-green-600'}>
                  {adjustedPrice! > skuData.currentPrice ? '+' : ''}₹{Math.abs(adjustedPrice! - skuData.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Margin Change:</span>
                <span className={adjustedMargin! > skuData.marginPercent ? 'text-green-600' : 'text-red-600'}>
                  {adjustedMargin! > skuData.marginPercent ? '+' : ''}{(adjustedMargin! - skuData.marginPercent).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}