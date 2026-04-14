import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

interface PromotionEffectivenessProps {
  skuData: any;
}

export function PromotionEffectiveness({ skuData }: PromotionEffectivenessProps) {
  const [selectedDiscount, setSelectedDiscount] = useState([10]);

  // Generate promotion effectiveness data
  const promotionData = [
    { discount: 0, units: 100, label: "0%" },
    { discount: 5, units: 110, label: "5%" },
    { discount: 10, units: 118, label: "10%" },
    { discount: 20, units: 135, label: "20%" },
    { discount: 30, units: 140, label: "30%" },
  ];

  const selectedDiscountValue = selectedDiscount[0];
  const selectedDataPoint = promotionData.find(d => d.discount === selectedDiscountValue) || promotionData[2];
  const baselineUnits = promotionData[0].units;
  const uplift = ((selectedDataPoint.units - baselineUnits) / baselineUnits) * 100;

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'units') {
      return [`${value} units`, 'Projected Sales'];
    }
    return [value, name];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Promotion Effectiveness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Discount Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Discount Level</label>
              <span className="text-sm text-muted-foreground">{selectedDiscountValue}%</span>
            </div>
            <Slider
              value={selectedDiscount}
              onValueChange={setSelectedDiscount}
              max={30}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promotionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium">{`Discount: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTooltip(payload[0].value, 'units', payload[0])[1]}: {formatTooltip(payload[0].value, 'units', payload[0])[0]}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                  {promotionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.discount === selectedDiscountValue 
                        ? "hsl(var(--primary))" 
                        : entry.discount === 0 
                          ? "hsl(var(--muted-foreground))" 
                          : "hsl(var(--accent))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dynamic Summary */}
          <div className="pt-4 border-t">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">
                At {selectedDiscountValue}% discount, projected sales = {selectedDataPoint.units} units 
                <span className={`ml-1 ${uplift > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  ({uplift > 0 ? '+' : ''}{uplift.toFixed(0)}% uplift)
                </span>
              </p>
            </div>
            
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted-foreground"></div>
                <span>Baseline (0%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-accent"></div>
                <span>Promotion</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}