import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface PricingHistoryProps {
  skuId: string;
  currentPrice: number;
}

export function PricingHistory({ skuId, currentPrice }: PricingHistoryProps) {
  // Generate mock 30-day pricing history
  const generatePricingHistory = () => {
    const data = [];
    const basePrice = currentPrice;
    const baseCompetitorPrice = currentPrice * 0.92; // Competitors typically 8% lower
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Add some variation
      const ourPriceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const competitorVariation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
      
      data.push({
        date: date.toISOString().split('T')[0],
        ourPrice: basePrice * (1 + ourPriceVariation),
        competitorAvg: baseCompetitorPrice * (1 + competitorVariation),
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return data;
  };

  const pricingData = generatePricingHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pricing History (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pricingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
                  name === 'ourPrice' ? 'Our Price' : 'Competitor Avg'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="ourPrice" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Our Price"
              />
              <Line 
                type="monotone" 
                dataKey="competitorAvg" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Competitor Avg"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span>Our Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-destructive" style={{backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, hsl(var(--destructive)) 2px, hsl(var(--destructive)) 4px)'}}></div>
            <span>Competitor Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}