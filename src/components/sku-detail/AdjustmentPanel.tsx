// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Calculator, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdjustmentPanelProps {
  currentPrice: number;
  currentMargin: number;
  adjustedPrice: number | null;
  adjustedMargin: number | null;
  onPriceChange: (price: number) => void;
  onMarginChange: (margin: number) => void;
  onReset: () => void;
}

export function AdjustmentPanel({
  currentPrice,
  currentMargin,
  adjustedPrice,
  adjustedMargin,
  onPriceChange,
  onMarginChange,
  onReset
}: AdjustmentPanelProps) {
  const [priceInput, setPriceInput] = useState(adjustedPrice?.toString() || currentPrice.toString());
  const [marginInput, setMarginInput] = useState(adjustedMargin?.toString() || currentMargin.toString());
  const { toast } = useToast();

  const handlePriceSubmit = () => {
    const newPrice = parseFloat(priceInput);
    if (newPrice > 0) {
      onPriceChange(newPrice);
      toast({
        title: "Price Updated",
        description: `New target price set to ₹${newPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      });
    }
  };

  const handleMarginSubmit = () => {
    const newMargin = parseFloat(marginInput);
    if (newMargin > 0 && newMargin < 100) {
      onMarginChange(newMargin);
      toast({
        title: "Margin Updated",
        description: `New target margin set to ${newMargin.toFixed(1)}%`,
      });
    }
  };

  const handleReset = () => {
    onReset();
    setPriceInput(currentPrice.toString());
    setMarginInput(currentMargin.toString());
    toast({
      title: "Values Reset",
      description: "Adjustments have been reset to original values",
    });
  };

  const priceChange = adjustedPrice ? adjustedPrice - currentPrice : 0;
  const marginChange = adjustedMargin ? adjustedMargin - currentMargin : 0;
  const isAdjusted = Math.abs(priceChange) > 0.01 || Math.abs(marginChange) > 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pricing Adjustments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Price Section */}
        <div className="space-y-3">
          <Label htmlFor="target-price" className="text-sm font-medium">
            Target Price
          </Label>
          <div className="flex gap-2">
            <Input
              id="target-price"
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="Enter target price"
              className="flex-1"
            />
            <Button onClick={handlePriceSubmit} size="sm">
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        <Separator />

        {/* Target Margin Section */}
        <div className="space-y-3">
          <Label htmlFor="target-margin" className="text-sm font-medium">
            Target Margin (%)
          </Label>
          <div className="flex gap-2">
            <Input
              id="target-margin"
              type="number"
              step="0.1"
              value={marginInput}
              onChange={(e) => setMarginInput(e.target.value)}
              placeholder="Enter target margin"
              className="flex-1"
            />
            <Button onClick={handleMarginSubmit} size="sm">
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {currentMargin.toFixed(1)}%
          </p>
        </div>

        {/* Impact Summary */}
        {isAdjusted && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-medium">Impact Summary</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price Change:</span>
                    <div className="flex items-center gap-1">
                      {priceChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-red-600" />
                      ) : priceChange < 0 ? (
                        <TrendingDown className="h-3 w-3 text-green-600" />
                      ) : null}
                       <span className={priceChange > 0 ? 'text-red-600' : priceChange < 0 ? 'text-green-600' : ''}>
                         {priceChange > 0 ? '+' : ''}₹{Math.abs(priceChange).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Margin Change:</span>
                    <div className="flex items-center gap-1">
                      {marginChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : marginChange < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      ) : null}
                      <span className={marginChange > 0 ? 'text-green-600' : marginChange < 0 ? 'text-red-600' : ''}>
                        {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Price:</span>
                    <span className="font-medium">₹{adjustedPrice?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Margin:</span>
                    <span className="font-medium">{adjustedMargin?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Adjustments are temporary and won't be saved</p>
          <p>• Price and margin are automatically calculated based on each other</p>
          <p>• Use Reset to return to original values</p>
        </div>
      </CardContent>
    </Card>
  );
}