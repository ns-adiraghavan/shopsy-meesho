import { Tag, Search, Package, CheckCircle2, Activity, LayoutDashboard, Moon, Sun } from "lucide-react";
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
    kpis: ["Composite Score", "Price Gap %", "Promo Intensity", "Availability Rate"],
    description: "Side-by-side Shopsy vs Meesho scorecard with category pressure map and event feed.",
  },
  {
    icon: Tag,
    label: "Pricing & Promotions",
    path: "/dashboard/pricing",
    kpis: ["Avg Price Gap", "SKUs Overpriced", "Discount Depth", "Flash Sale Candidates"],
    description: "Price gap tracking across 600 SKUs in Fashion, Beauty & Accessories.",
  },
  {
    icon: Search,
    label: "Gen Z Demand Signals",
    path: "/dashboard/genz",
    kpis: ["Trending SKUs", "Gen Z Score", "Keyword Rank", "Review Velocity"],
    description: "Gen Z traction scoring powered by keyword rank and review velocity on Meesho.",
  },
  {
    icon: Package,
    label: "Assortment Intelligence",
    path: "/dashboard/assortment",
    kpis: ["SKU Coverage %", "Gap Brands", "Quick-Add Candidates", "Category Depth"],
    description: "Assortment gap analysis with quick-add candidate identification across platforms.",
  },
  {
    icon: CheckCircle2,
    label: "Demand & Availability",
    path: "/dashboard/demand",
    kpis: ["Demand Score", "Stockout Risk", "Lost Demand Proxy", "Must-Have Health"],
    description: "Demand intensity signals and stockout risk tracking for supply-side prioritisation.",
  },
  {
    icon: Activity,
    label: "Promotion Budget Optimizer",
    path: "/dashboard/budget",
    kpis: ["ROI Score", "GMV Uplift (Est.)", "Budget Utilisation", "Promo Type Mix"],
    description: "Promotion budget optimizer with SKU-level GMV uplift estimates.",
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
                alt="Netscribes — Shopsy vs Meesho Intelligence"
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
          Shopsy vs Meesho —{" "}
          <span className="text-primary">Competitive Intelligence Dashboard</span>
        </h1>
        <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Track pricing gaps, Gen Z demand signals, assortment gaps, and promotion opportunities across India's leading social commerce platforms.
        </p>
        <div className="flex flex-col items-center gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-sm text-muted-foreground max-w-lg">
            <span>✦ Price gap tracking across 600 SKUs in Fashion, Beauty & Accessories</span>
            <span>✦ Gen Z traction scoring powered by keyword rank and review velocity</span>
            <span>✦ Promotion budget optimizer with SKU-level GMV uplift estimates</span>
            <span>✦ Assortment gap analysis with quick-add candidate identification</span>
          </div>
          <Button size="lg" asChild>
            <Link to="/login">View Dashboard</Link>
          </Button>
        </div>
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
            alt="Netscribes — Shopsy vs Meesho Intelligence"
            className="h-5 w-auto object-contain"
          />
          <span className="text-xs text-muted-foreground">© 2025 Netscribes · Shopsy vs Meesho Competitive Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
