// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Search, Package, CheckCircle2, MapPin, Download } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Pricing",
    icon: Tag,
    href: "/dashboard/pricing",
    description: "Pricing & Promotion Intelligence",
  },
  {
    label: "Search",
    icon: Search,
    href: "/dashboard/search",
    description: "Search & Shelf Visibility",
  },
  {
    label: "Assortment",
    icon: Package,
    href: "/dashboard/assortment",
    description: "Assortment & Product Mix",
  },
  {
    label: "Availability",
    icon: CheckCircle2,
    href: "/dashboard/availability",
    description: "Availability Intelligence",
  },
  {
    label: "Local Markets",
    icon: MapPin,
    href: "/dashboard/local",
    description: "City-level intelligence",
  },
  {
    label: "Export",
    icon: Download,
    href: "#",
    description: "Download intelligence reports",
  },
];

export function QuickActions() {
  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle>Quick Navigation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors group relative"
              asChild
            >
              <Link to={action.href}>
                <action.icon className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                </div>
                {/* Hover tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap pointer-events-none">
                  {action.description}
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
