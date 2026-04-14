import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, TrendingDown, Package, Shield, Filter, Check, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { categories } from "@/data/platformData";
import { useToast } from "@/hooks/use-toast";

const alertCategories = ["All Categories", ...categories];

const dateRanges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

interface Alert {
  id: string;
  type: "competitor" | "inventory" | "compliance";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  date: string;
  category: string;
  competitor?: string;
  affectedSKUs: number;
  averageDropPercent?: number;
  acknowledged?: boolean;
  acknowledgedNote?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, { acknowledged: boolean; note: string }>>({});
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const { toast } = useToast();

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((alert) => alert.category === selectedCategory);
    }

    const now = new Date();
    const daysBack = selectedDateRange === "7d" ? 7 : selectedDateRange === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((alert) => new Date(alert.date) >= cutoffDate);

    if (showSettings) {
      filtered = filtered.filter((alert) => {
        if (alert.type === "competitor" && alert.averageDropPercent) {
          return alert.averageDropPercent >= alertThreshold;
        }
        return true;
      });
    }

    return filtered;
  }, [alerts, selectedCategory, selectedDateRange, showSettings, alertThreshold]);

  const handleAcknowledgeAlert = (alert: Alert) => {
    setAcknowledgedAlerts((prev) => ({
      ...prev,
      [alert.id]: { acknowledged: true, note: acknowledgeNote },
    }));
    setSelectedAlert(null);
    setAcknowledgeNote("");
    toast({
      title: "Alert Acknowledged",
      description: `Alert "${alert.title}" has been acknowledged.`,
    });
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "competitor":
        return <TrendingDown className="h-4 w-4" />;
      case "inventory":
        return <Package className="h-4 w-4" />;
      case "compliance":
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-status-critical bg-status-critical/10 border-status-critical/20";
      case "high":
        return "text-status-high bg-status-high/10 border-status-high/20";
      case "medium":
        return "text-status-medium bg-status-medium/10 border-status-medium/20";
      default:
        return "text-status-low bg-status-low/10 border-status-low/20";
    }
  };

  const getSeverityBadgeVariant = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
      case "high":
        return "destructive" as const;
      case "medium":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Badge variant="secondary">{filteredAlerts.length}</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <div className="flex items-center gap-1 text-sm">
            <Filter className="h-4 w-4" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {alertCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Alert Threshold</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show drops ≥</span>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-16 h-6 px-2 text-xs border rounded"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No alerts match the selected filters
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isAcknowledged = acknowledgedAlerts[alert.id]?.acknowledged;
            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-sm",
                  getSeverityColor(alert.severity),
                  isAcknowledged && "opacity-60 border-success/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isAcknowledged ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      getAlertIcon(alert.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={cn(
                          "font-medium text-sm truncate",
                          isAcknowledged && "line-through"
                        )}
                      >
                        {alert.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        {isAcknowledged && (
                          <Badge variant="outline" className="text-xs">
                            Acknowledged
                          </Badge>
                        )}
                        <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {alert.description}
                    </p>
                    {acknowledgedAlerts[alert.id]?.note && (
                      <div className="text-xs bg-muted/50 p-2 rounded mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">Note:</span>
                        </div>
                        <p>{acknowledgedAlerts[alert.id].note}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{alert.timestamp}</div>
                      {!isAcknowledged && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              Acknowledge
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Acknowledge Alert</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-sm">
                                <p className="font-medium">{alert.title}</p>
                                <p className="text-muted-foreground">{alert.description}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Add a note (optional):
                                </label>
                                <Textarea
                                  value={acknowledgeNote}
                                  onChange={(e) => setAcknowledgeNote(e.target.value)}
                                  placeholder="Explain the action taken or reason for acknowledgment..."
                                  className="mt-2"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAlert(null);
                                    setAcknowledgeNote("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => handleAcknowledgeAlert(alert)}>
                                  Acknowledge
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
