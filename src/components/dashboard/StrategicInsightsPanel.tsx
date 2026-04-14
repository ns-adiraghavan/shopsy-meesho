// @ts-nocheck
import { Lightbulb, TrendingUp, TrendingDown, BarChart2, ShieldCheck, Target, Zap, MapPin, Package, Search, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type InsightType = "positive" | "warning" | "neutral" | "critical";

export interface Insight {
  icon?: "trend-up" | "trend-down" | "chart" | "shield" | "target" | "zap" | "pin" | "package" | "search" | "tag";
  title: string;
  body: string;
  type?: InsightType;
}

const ICONS = {
  "trend-up": TrendingUp,
  "trend-down": TrendingDown,
  "chart": BarChart2,
  "shield": ShieldCheck,
  "target": Target,
  "zap": Zap,
  "pin": MapPin,
  "package": Package,
  "search": Search,
  "tag": Tag,
};

const TYPE_STYLES: Record<InsightType, { card: string; icon: string; badge: string }> = {
  positive: {
    card: "border-status-low/30 bg-status-low/5",
    icon: "bg-status-low/15 text-status-low",
    badge: "bg-status-low/10 text-status-low border-status-low/20",
  },
  warning: {
    card: "border-status-medium/30 bg-status-medium/5",
    icon: "bg-status-medium/15 text-status-medium",
    badge: "bg-status-medium/10 text-status-medium border-status-medium/20",
  },
  critical: {
    card: "border-status-high/30 bg-status-high/5",
    icon: "bg-status-high/15 text-status-high",
    badge: "bg-status-high/10 text-status-high border-status-high/20",
  },
  neutral: {
    card: "border-border/60 bg-muted/20",
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
};

interface StrategicInsightsPanelProps {
  insights: Insight[];
}

export function StrategicInsightsPanel({ insights }: StrategicInsightsPanelProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Strategic Insights</h2>
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Strategic Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => {
              const type = insight.type ?? "neutral";
              const styles = TYPE_STYLES[type];
              const IconComp = insight.icon ? ICONS[insight.icon] : Lightbulb;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-4 flex flex-col gap-2.5 transition-all hover:shadow-sm",
                    styles.card
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-md shrink-0 mt-0.5", styles.icon)}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-snug text-foreground">{insight.title}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-11">{insight.body}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
