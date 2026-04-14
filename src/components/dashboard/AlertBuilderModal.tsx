// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const METRICS = [
  "Promotion Share",
  "Avg Discount Depth",
  "SKU Availability Rate",
  "Top-10 Presence",
  "Top-3 Search Share",
  "Price Gap vs Category",
  "Stockout Rate",
  "Market Competition Index",
];

const CONDITIONS = [
  "> 1.5x category average",
  "< category average",
  "> 20%",
  "< 80%",
  "drops by > 5%",
  "exceeds threshold",
  "falls below threshold",
];

const PLATFORMS = ["All Platforms", "Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];
const CITIES = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];
const CATEGORIES = [
  "All Categories",
  "Snacks & Beverages",
  "Dairy & Eggs",
  "Fruits & Vegetables",
  "Personal Care",
  "Household Essentials",
  "Staples & Grains",
];

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  platform: string;
  city: string;
  category: string;
  createdAt: string;
  lastTriggered: string | null;
}

const SIMULATED_TRIGGERS: Record<string, string> = {
  "Promotion Share": "2h ago — Blinkit +32% promo rate in Bangalore",
  "Avg Discount Depth": "4h ago — Swiggy Instamart avg discount rose to 18.4%",
  "SKU Availability Rate": "1d ago — BigBasket Now dropped to 76% availability",
  "Top-10 Presence": "3h ago — Zepto fell to 38% Top-10 presence",
  "Top-3 Search Share": "6h ago — Blinkit gained 12% elite positions",
  "Stockout Rate": "45m ago — Zepto stockout spike in Delhi NCR",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: AlertRule[];
  onSave: (alert: AlertRule) => void;
  onDelete: (id: string) => void;
}

export function AlertBuilderModal({ open, onOpenChange, alerts, onSave, onDelete }: Props) {
  const [view, setView] = useState<"list" | "create">("list");
  const [form, setForm] = useState({
    name: "",
    metric: METRICS[0],
    condition: CONDITIONS[0],
    platform: "All Platforms",
    city: "All Cities",
    category: "All Categories",
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    const rule: AlertRule = {
      id: `alert-${Date.now()}`,
      ...form,
      createdAt: new Date().toISOString(),
      lastTriggered: SIMULATED_TRIGGERS[form.metric] ?? null,
    };
    onSave(rule);
    setForm({ name: "", metric: METRICS[0], condition: CONDITIONS[0], platform: "All Platforms", city: "All Cities", category: "All Categories" });
    setView("list");
  };

  const set = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Alert Builder
          </DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            onClick={() => setView("list")}
            className={`flex-1 text-xs py-1.5 px-3 rounded-md font-medium transition-all ${
              view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Competitive Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setView("create")}
            className={`flex-1 text-xs py-1.5 px-3 rounded-md font-medium transition-all ${
              view === "create" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            + New Alert
          </button>
        </div>

        {/* ── Alert List ── */}
        {view === "list" && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-sm text-muted-foreground">No alerts configured yet.</p>
                <Button variant="outline" size="sm" onClick={() => setView("create")}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create your first alert
                </Button>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-border bg-card p-3 space-y-2 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{alert.name}</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                          {alert.metric}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When <span className="text-foreground font-medium">{alert.metric}</span>{" "}
                        <span className="text-status-high font-medium">{alert.condition}</span>
                        {alert.platform !== "All Platforms" && (
                          <> · <span className="text-foreground">{alert.platform}</span></>
                        )}
                        {alert.city !== "All Cities" && (
                          <> · <span className="text-foreground">{alert.city}</span></>
                        )}
                        {alert.category !== "All Categories" && (
                          <> · <span className="text-foreground">{alert.category}</span></>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => onDelete(alert.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-status-high p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {alert.lastTriggered && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Last triggered: <span className="text-status-high font-medium">{alert.lastTriggered}</span></span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Create Form ── */}
        {view === "create" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Alert Name</Label>
              <Input
                placeholder="e.g. Blinkit Promo Surge — Bangalore"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Metric to Monitor</Label>
                <Select value={form.metric} onValueChange={(v) => set("metric", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Condition</Label>
                <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">City</Label>
                <Select value={form.city} onValueChange={(v) => set("city", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Preview rule */}
            {form.name && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs space-y-0.5">
                <p className="font-medium text-primary">Rule Preview</p>
                <p className="text-muted-foreground">
                  Trigger <span className="text-foreground font-medium">"{form.name}"</span> when{" "}
                  <span className="text-foreground font-medium">{form.metric}</span>{" "}
                  <span className="text-status-high font-medium">{form.condition}</span>
                  {form.platform !== "All Platforms" && <> on <span className="text-foreground">{form.platform}</span></>}
                  {form.city !== "All Cities" && <> in <span className="text-foreground">{form.city}</span></>}
                  {form.category !== "All Categories" && <> for <span className="text-foreground">{form.category}</span></>}.
                </p>
              </div>
            )}
          </div>
        )}

        {view === "create" && (
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("list")}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}>
              Save Alert
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
