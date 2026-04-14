import { Tag, Search, Package, CheckCircle2, MapPin, Activity, LayoutDashboard, Moon, Sun } from "lucide-react";
import logoColor from "@/assets/netscribes-logo-color.png";
import logoWhite from "@/assets/netscribes-logo-white.png";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MODULES = [
  {
    icon: LayoutDashboard,
    label: "Competitive Overview",
    path: "/dashboard",
    kpis: ["Avg Price Gap vs Competitors", "Availability Rate", "Search Visibility", "SKU Coverage"],
    description: "Composite platform scorecard with category price heatmap and pressure analysis.",
  },
  {
    icon: Tag,
    label: "Pricing & Promotion",
    path: "/dashboard/pricing",
    kpis: ["Average Discount", "Promotion Intensity", "SKUs Under Promotion", "Price Observations"],
    description: "Track price movements, discount depth, and promotional activity across platforms.",
  },
  {
    icon: Search,
    label: "Search & Shelf Visibility",
    path: "/dashboard/search",
    kpis: ["Page-1 Presence", "Elite Rank Share", "Keywords Tracked", "Search Observations"],
    description: "Monitor top-10 and top-3 search placements, sponsored share, and rank distribution.",
  },
  {
    icon: Package,
    label: "Assortment Intelligence",
    path: "/dashboard/assortment",
    kpis: ["SKU Coverage %", "Listed SKUs", "Missing SKUs", "Categories Covered"],
    description: "Analyse SKU breadth, coverage gaps, and platform-exclusive listings by category.",
  },
  {
    icon: CheckCircle2,
    label: "Availability Intelligence",
    path: "/dashboard/availability",
    kpis: ["Avg Availability Rate", "Best Platform", "Lowest Platform", "Availability Gap"],
    description: "Track stockout risk, fill rates, must-have SKU health, and category availability.",
  },
  {
    icon: MapPin,
    label: "Local Market Intelligence",
    path: "/dashboard/local",
    kpis: ["Avg City Score", "Best Performing City", "Lowest Performing City", "Cities Tracked"],
    description: "City-level deep dives into availability, pricing variance, and search competitiveness.",
  },
  {
    icon: Activity,
    label: "Competitive Risk & Volatility",
    path: "/dashboard/events",
    kpis: ["Events Detected", "Price Drop Alerts", "Promotion Alerts", "Stockout Alerts"],
    description: "Monitor competitor events, price volatility, rank instability, and SKU availability risk.",
  },
];

const Landing = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={theme === "dark" ? logoWhite : logoColor}
                alt="Netscribes"
                className="h-8 w-auto object-contain"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center max-w-3xl">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Quick-Commerce{" "}
          <span className="text-primary">Intelligence Platform</span>
        </h1>
        <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Real-time competitive intelligence across pricing, availability, search, and assortment — for Zepto, Blinkit, Swiggy Instamart, and BigBasket Now.
        </p>
        <Button size="lg" asChild>
          <Link to="/login">Open Dashboard →</Link>
        </Button>
      </section>

      {/* Module Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Intelligence Modules</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULES.map(({ icon: Icon, label, path, kpis, description }) => (
            <Link
              key={path}
              to={path}
              className="group rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold leading-snug">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {kpis.map((kpi) => (
                  <span
                    key={kpi}
                    className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/60"
                  >
                    {kpi}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center gap-3">
          <img
            src={theme === "dark" ? logoWhite : logoColor}
            alt="Netscribes"
            className="h-5 w-auto object-contain"
          />
          <span className="text-xs text-muted-foreground">© 2024 Netscribes · Public data competitive intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
