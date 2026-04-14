// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Package, Shield } from "lucide-react";
import { alertsData } from "@/data/dashboardData";

interface RelatedAlertsProps {
  skuId: string;
  category: string;
}

export function RelatedAlerts({ skuId, category }: RelatedAlertsProps) {
  // Filter alerts related to this SKU or category
  const relatedAlerts = alertsData.filter(alert => 
    alert.category?.toLowerCase().includes(category.toLowerCase().split(' ')[0]) ||
    alert.description.toLowerCase().includes(skuId.toLowerCase())
  ).slice(0, 4); // Show max 4 alerts

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'competitor': return AlertTriangle;
      case 'inventory': return Package;
      case 'compliance': return Shield;
      default: return Clock;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  if (relatedAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Related Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No alerts for this SKU or category</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Related Alerts ({relatedAlerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relatedAlerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            
            return (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <IconComponent className={`h-4 w-4 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                    <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{alert.timestamp}</span>
                    {alert.affectedSKUs && (
                      <span>{alert.affectedSKUs} SKUs affected</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {relatedAlerts.length >= 4 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-primary hover:underline">
              View all alerts for this category
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}