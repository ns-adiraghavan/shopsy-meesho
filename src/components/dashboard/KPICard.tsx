import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, Minus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  trend?: 'up' | 'down' | 'neutral';
  status?: 'low' | 'medium' | 'high' | 'critical';
  tooltip?: string;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeType = 'percentage', 
  trend, 
  status = 'low',
  tooltip,
  className 
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case 'critical':
        return 'border-l-4 border-l-status-critical';
      case 'high':
        return 'border-l-4 border-l-status-high';
      case 'medium':
        return 'border-l-4 border-l-status-medium';
      default:
        return 'border-l-4 border-l-status-low';
    }
  };

  return (
    <TooltipProvider>
      <Card className={cn("bg-gradient-card", getStatusBorder(), className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              {title}
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
              {getTrendIcon()}
              {Math.abs(change)}{changeType === 'percentage' ? '%' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}