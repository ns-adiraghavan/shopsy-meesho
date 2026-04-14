// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import { TrendingDown } from "lucide-react";

interface ConsumerPriceSensitivityProps {
  skuData: any;
  adjustedPrice: number | null;
}

export function ConsumerPriceSensitivity({ skuData, adjustedPrice }: ConsumerPriceSensitivityProps) {
  // Generate demand curve data (lower prices = higher demand)
  const generateDemandCurve = () => {
    const basePrice = skuData.currentPrice;
    const baseDemand = 100; // units per week
    
    return [
      { price: basePrice * 0.7, demand: baseDemand * 1.4 },
      { price: basePrice * 0.8, demand: baseDemand * 1.25 },
      { price: basePrice * 0.9, demand: baseDemand * 1.1 },
      { price: basePrice * 0.95, demand: baseDemand * 1.05 },
      { price: basePrice, demand: baseDemand },
      { price: basePrice * 1.05, demand: baseDemand * 0.95 },
      { price: basePrice * 1.1, demand: baseDemand * 0.85 },
      { price: basePrice * 1.2, demand: baseDemand * 0.7 },
      { price: basePrice * 1.3, demand: baseDemand * 0.55 },
    ];
  };

  const demandData = generateDemandCurve();
  
  // Calculate elasticity text
  const getElasticityText = () => {
    if (skuData.elasticityScore > 7) {
      return { text: "This SKU is highly price-sensitive.", color: "text-green-600" };
    } else if (skuData.elasticityScore >= 4) {
      return { text: "This SKU has moderate price sensitivity.", color: "text-yellow-600" };
    } else {
      return { text: "This SKU is price-inelastic.", color: "text-gray-600" };
    }
  };

  const elasticityInfo = getElasticityText();

  // Custom dot component for special points
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isCurrentPrice = Math.abs(payload.price - skuData.currentPrice) < 1;
    const isCompetitorPrice = Math.abs(payload.price - skuData.competitorAvg) < 1;
    const isAdjustedPrice = adjustedPrice && Math.abs(payload.price - adjustedPrice) < 1;

    if (isCurrentPrice) {
      return <Dot cx={cx} cy={cy} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />;
    }
    if (isCompetitorPrice) {
      return <Dot cx={cx} cy={cy} r={6} fill="#ea580c" stroke="#ffffff" strokeWidth={2} />;
    }
    if (isAdjustedPrice) {
      return <Dot cx={cx} cy={cy} r={6} fill="#dc2626" stroke="#ffffff" strokeWidth={2} />;
    }
    return null;
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'demand') {
      const isCurrentPrice = Math.abs(props.payload.price - skuData.currentPrice) < 1;
      const isCompetitorPrice = Math.abs(props.payload.price - skuData.competitorAvg) < 1;
      const isAdjustedPrice = adjustedPrice && Math.abs(props.payload.price - adjustedPrice) < 1;
      
      let label = 'Projected Demand';
      if (isCurrentPrice) label = 'Current Price';
      if (isCompetitorPrice) label = 'Competitor Average';
      if (isAdjustedPrice) label = 'Adjusted Price';
      
      return [`${Math.round(value)} units/week`, label];
    }
    return [value, name];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Consumer Price Sensitivity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demandData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="price" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
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
                        <p className="text-sm font-medium">{`Price: ₹${Number(label).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTooltip(payload[0].value, 'demand', payload[0])[1]}: {formatTooltip(payload[0].value, 'demand', payload[0])[0]}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="demand" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={CustomDot}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Elasticity Indicator */}
        <div className="mt-4 pt-4 border-t">
          <p className={`text-sm font-medium ${elasticityInfo.color}`}>
            {elasticityInfo.text}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Current Price</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span>Competitor Average</span>
            </div>
            {adjustedPrice && adjustedPrice !== skuData.currentPrice && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Adjusted Price</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}