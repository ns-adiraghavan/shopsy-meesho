import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SKUOverview } from "@/components/sku-detail/SKUOverview";
import { PricingHistory } from "@/components/sku-detail/PricingHistory";
import { CompetitorTable } from "@/components/sku-detail/CompetitorTable";
import { RelatedAlerts } from "@/components/sku-detail/RelatedAlerts";
import { RegionalPricingInsights } from "@/components/sku-detail/RegionalPricingInsights";
import { AdjustmentPanel } from "@/components/sku-detail/AdjustmentPanel";
import { ConsumerPriceSensitivity } from "@/components/sku-detail/ConsumerPriceSensitivity";
import { PromotionEffectiveness } from "@/components/sku-detail/PromotionEffectiveness";
import { topRiskSKUs } from "@/data/dashboardData";
import { skuDetails } from "@/data/skuData";
import { useSKUAdjustment } from "@/contexts/SKUAdjustmentContext";

export default function SKUDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSKUAdjustment, getSKUAdjustment } = useSKUAdjustment();
  const [skuData, setSKUData] = useState<any>(null);
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  const [adjustedMargin, setAdjustedMargin] = useState<number | null>(null);

  useEffect(() => {
    // Find SKU data from topRiskSKUs first, then fallback to skuDetails
    let sku: any = topRiskSKUs.find(s => s.sku === id);
    let isFromRiskSKUs = true;
    
    if (!sku) {
      sku = skuDetails.find(s => s.sku === id);
      isFromRiskSKUs = false;
    }
    
    if (sku) {
      // Convert to consistent format
      const formattedSKU = {
        sku: sku.sku,
        name: sku.name,
        category: sku.category,
        brand: isFromRiskSKUs ? "TechBrand" : (sku.brand || "N/A"),
        currentPrice: isFromRiskSKUs 
          ? (typeof sku.currentPrice === 'string' ? parseFloat(sku.currentPrice.replace('₹', '').replace(/,/g, '')) : sku.currentPrice)
          : sku.currentPrice,
        cost: isFromRiskSKUs 
          ? (typeof sku.currentPrice === 'string' ? parseFloat(sku.currentPrice.replace('₹', '').replace(/,/g, '')) : sku.currentPrice) * 0.7
          : (sku.cost || sku.currentPrice * 0.7),
        marginPercent: sku.marginPercent || sku.margin || 20,
        competitorAvg: isFromRiskSKUs
          ? (typeof sku.competitorAvg === 'string' ? parseFloat(sku.competitorAvg.replace('₹', '').replace(/,/g, '')) : sku.competitorAvg)
          : (sku.competitorAvg || sku.currentPrice * 0.9),
        priceGap: isFromRiskSKUs 
          ? (sku.gap ? parseFloat(sku.gap.replace('%', '').replace('+', '')) : 5)
          : 5,
        riskLevel: sku.riskLevel || sku.risk || "Medium",
        inventory: sku.inventory || 50,
        salesVelocity: sku.salesVelocity || "Medium",
        elasticityScore: sku.elasticityScore || Math.floor(Math.random() * 6) + 3 // Mock score 3-8
      };
      setSKUData(formattedSKU);
      
      // Check if there's an existing adjustment for this SKU
      const existingAdjustment = getSKUAdjustment(formattedSKU.sku);
      if (existingAdjustment) {
        setAdjustedPrice(existingAdjustment.adjustedPrice);
        setAdjustedMargin(existingAdjustment.adjustedMargin);
      } else {
        setAdjustedPrice(formattedSKU.currentPrice);
        setAdjustedMargin(formattedSKU.marginPercent);
      }
    }
  }, [id]);

  const handlePriceChange = (newPrice: number) => {
    setAdjustedPrice(newPrice);
    // Calculate new margin based on price
    if (skuData && skuData.cost) {
      const newMargin = ((newPrice - skuData.cost) / newPrice) * 100;
      setAdjustedMargin(newMargin);
      
      // Update the global adjustment state
      updateSKUAdjustment({
        sku: skuData.sku,
        adjustedPrice: newPrice,
        adjustedMargin: newMargin,
        originalPrice: skuData.currentPrice,
        originalMargin: skuData.marginPercent
      });
    }
  };

  const handleMarginChange = (newMargin: number) => {
    setAdjustedMargin(newMargin);
    // Calculate new price based on margin
    if (skuData && skuData.cost) {
      const newPrice = skuData.cost / (1 - newMargin / 100);
      setAdjustedPrice(newPrice);
      
      // Update the global adjustment state
      updateSKUAdjustment({
        sku: skuData.sku,
        adjustedPrice: newPrice,
        adjustedMargin: newMargin,
        originalPrice: skuData.currentPrice,
        originalMargin: skuData.marginPercent
      });
    }
  };

  const handleReset = () => {
    if (skuData) {
      setAdjustedPrice(skuData.currentPrice);
      setAdjustedMargin(skuData.marginPercent);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (!skuData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">SKU Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested SKU could not be found.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="self-start"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
                <span>/</span>
                <span>SKU Detail</span>
                <span>/</span>
                <span className="text-foreground font-medium">{skuData.sku}</span>
              </div>
            </div>
            <Badge variant={getRiskColor(skuData.riskLevel)} className="self-start sm:self-center">
              {skuData.riskLevel} Risk
            </Badge>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl lg:text-3xl font-bold">{skuData.name}</h1>
            <p className="text-sm lg:text-base text-muted-foreground">{skuData.category} • {skuData.sku}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - SKU Overview */}
          <div className="order-1 space-y-4 lg:space-y-6">
            <SKUOverview 
              skuData={skuData}
              adjustedPrice={adjustedPrice}
              adjustedMargin={adjustedMargin}
            />
            {/* Competitor Comparison */}
            <div className="bg-muted/30 p-3 lg:p-4 rounded-lg border-t border-border">
              <CompetitorTable skuId={skuData.sku} category={skuData.category} />
            </div>
            {/* Regional Pricing Insights */}
            <RegionalPricingInsights skuId={skuData.sku} />
          </div>

          {/* Right Column - Adjustments (prioritized on mobile) */}
          <div className="order-2 lg:order-3 space-y-4 lg:space-y-6">
            <AdjustmentPanel
              currentPrice={skuData.currentPrice}
              currentMargin={skuData.marginPercent}
              adjustedPrice={adjustedPrice}
              adjustedMargin={adjustedMargin}
              onPriceChange={handlePriceChange}
              onMarginChange={handleMarginChange}
              onReset={handleReset}
            />
            <div className="bg-muted/30 p-3 lg:p-4 rounded-lg border-t border-border">
              <RelatedAlerts skuId={skuData.sku} category={skuData.category} />
            </div>
          </div>

          {/* Center Column - Analysis */}
          <div className="order-3 lg:order-2 space-y-4 lg:space-y-6">
            <div className="bg-muted/30 p-3 lg:p-4 rounded-lg border-t border-border">
              <PricingHistory skuId={skuData.sku} currentPrice={skuData.currentPrice} />
            </div>
            <div className="bg-muted/30 p-3 lg:p-4 rounded-lg border-t border-border">
              <ConsumerPriceSensitivity skuData={skuData} adjustedPrice={adjustedPrice} />
            </div>
            <div className="bg-muted/30 p-3 lg:p-4 rounded-lg border-t border-border">
              <PromotionEffectiveness skuData={skuData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}