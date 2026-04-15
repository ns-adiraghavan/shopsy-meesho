import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import logoColor from "@/assets/netscribes-logo-color.png";
import logoWhite from "@/assets/netscribes-logo-white.png";

const Login = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard/budget");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      {/* Dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary) / 0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Radial vignette to fade dot grid at edges */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Header bar */}
      <header className="relative z-10 border-b border-border/60 bg-card/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoWhite : logoColor}
            alt="Netscribes"
            className="h-7 w-auto object-contain"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero text */}
        <div className="text-center mb-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/8 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
              Live Intelligence
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
            Shopsy vs Meesho{" "}
            <span className="text-primary">Competitive Intelligence</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track pricing gaps, Gen Z demand signals, assortment gaps, and promotion
            opportunities across India's leading social commerce platforms.
          </p>
        </div>

        {/* Login card */}
        <Card className="w-full max-w-sm border border-border/80 bg-card/90 backdrop-blur-md shadow-xl shadow-primary/5">
          <CardContent className="pt-7 pb-7 px-7">
            <h2 className="text-base font-semibold text-foreground mb-5">
              Sign in to your account
            </h2>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/60 border-border/70 focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/60 border-border/70 focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9 text-sm font-semibold mt-2 group"
              >
                Sign In
                <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                Don't have access?{" "}
                <Link
                  to="#"
                  className="text-primary font-medium hover:underline underline-offset-4"
                >
                  Request Access
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {["Shopsy", "Meesho"].map((p) => (
            <span
              key={p}
              className="px-2.5 py-1 rounded-full border border-border/60 bg-muted/60 text-[10px] font-medium text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-card/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-center gap-2">
          <img
            src={theme === "dark" ? logoWhite : logoColor}
            alt="Netscribes"
            className="h-4 w-auto object-contain opacity-70"
          />
          <span className="text-[11px] text-muted-foreground/70">
            © 2024 Netscribes · Public data competitive intelligence
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
