import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Where is Shopsy most overpriced vs Meesho?",
  "Which Gen Z categories is Meesho winning?",
  "What are the top stockout risks on Shopsy?",
  "Where should we allocate a \u20B95 lakh promo budget?",
];

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":            "Competitive Overview",
  "/dashboard/pricing":    "Pricing & Promotions",
  "/dashboard/genz":       "Gen Z Demand Signals",
  "/dashboard/assortment": "Assortment Intelligence",
  "/dashboard/demand":     "Demand & Availability",
  "/dashboard/budget":     "Promotion Budget Optimizer",
};

/* ------------------------------------------------------------------ */
/*  Hardcoded response engine                                         */
/* ------------------------------------------------------------------ */

function getHardcodedResponse(userMessage: string, pageLabel: string): string {
  const q = userMessage.toLowerCase();

  if (q.includes("competitiveness") || q.includes("overall") || q.includes("score")) {
    return "**Competitive Score**\n- Meesho: 65 vs Shopsy: 59\n- Shopsy lags on promotion intensity (15% vs 23%) and search visibility (81% vs 93%).\n- Shopsy\u2019s advantage: availability rate (84.9% vs 81.5%) and Flipkart-exclusive brands in Men\u2019s Casual Wear and Footwear.";
  }
  if (q.includes("price gap") || q.includes("overpriced")) {
    return "**Price Gap Summary**\n- Shopsy is overpriced vs Meesho by +13.5% on average.\n- Worst categories: Accessories (+14%), Women\u2019s Western Wear (+12%), Beauty & Skincare (+10%).\n- Shopsy is cheaper in: Men\u2019s Casual Wear (\u22122%), Footwear (\u22123%), Innerwear (\u22121%).";
  }
  if (q.includes("promo") || q.includes("promotion") || q.includes("discount")) {
    return "**Promotion Gap**\n- Meesho promo rate: 23% of SKU-days vs Shopsy: 14.8%.\n- Meesho average discount depth: 23.7% vs Shopsy: 15.4%.\n- Meesho is running Flash Sales in Accessories and Women\u2019s Western Wear \u2014 Shopsy has not responded in either category.";
  }
  if (q.includes("gen z") || q.includes("genz") || q.includes("trending") || q.includes("traction")) {
    return "**Gen Z Demand Signals**\n- Top trending on Meesho: Co-ord sets, Glass Skin Routine, Y2K Dresses, Aesthetic Accessories.\n- StyleCast and Anouk score above 70 on Meesho \u2014 both are under-listed on Shopsy.\n- Shopsy wins 0 of the top-3 Gen Z keyword slots. Meesho dominates 78% of Gen Z top-10 positions.";
  }
  if (q.includes("assortment") || q.includes("catalogue") || q.includes("missing") || q.includes("gap")) {
    return "**Assortment Gap**\n- Meesho lists 533 SKUs; Shopsy lists 498.\n- Meesho-leaning brands (StyleCast, SASSAFRAS, Anouk, Rangmanch) have 91% listing rate on Meesho vs 52% on Shopsy.\n- 6 high-priority gap brands identified: StyleCast, SASSAFRAS, Anouk, Rangmanch, Limelight, Trendzolook.";
  }
  if (q.includes("stockout") || q.includes("availability") || q.includes("oos") || q.includes("supply")) {
    return "**Availability & Demand**\n- Shopsy overall availability: 84.9% (better than Meesho\u2019s 81.5% due to Flipkart logistics).\n- Shopsy stockout clusters: Women\u2019s Ethnic Wear (83% available = 17% OOS risk) and Beauty & Skincare (81%).\n- High demand + high stockout SKUs should be supply-fixed before any promotion is run.";
  }
  if (q.includes("budget") || q.includes("spend") || q.includes("allocat") || q.includes("gmv") || q.includes("roi")) {
    return "**Promotion Budget Optimizer**\n- At \u20B95,00,000 budget: top allocation is Women\u2019s Western Wear Flash Sale (12% discount), Beauty & Skincare Coupon (10%), Accessories Flat Discount (8%).\n- Estimated GMV uplift is a synthetic benchmark \u2014 replace with Shopsy\u2019s actual conversion data for production use.\n- Filter out OOS SKUs before any allocation \u2014 never promote what you can\u2019t fulfil.";
  }
  if (q.includes("explain") || q.includes("this page")) {
    return `**${pageLabel}**\nThis page provides competitive intelligence for the Shopsy vs Meesho dashboard. Key areas:\n- Price gap analysis and promotion tracking\n- Gen Z demand signals from Meesho\n- Assortment gap identification\n- Budget allocation recommendations\n\nTry asking about specific topics like price gaps, Gen Z trends, or stockout risks.`;
  }

  return `**${pageLabel}**\nI can answer questions about Shopsy vs Meesho competitive positioning. Try asking about: price gaps, promotion strategy, Gen Z demand signals, assortment gaps, stockouts, or the budget optimizer.`;
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer                                                 */
/* ------------------------------------------------------------------ */

function formatMessage(content: string) {
  const lines = content.split("\n").filter((l, i, arr) => {
    if (l.trim() === "" && arr[i - 1]?.trim() === "") return false;
    return true;
  });

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={i} className="text-[11px] font-bold text-primary/80 uppercase tracking-wider mt-2 mb-0.5 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("\u2022 ")) {
          const text = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary/60 mt-[3px] shrink-0 text-[10px]">{"\u25B8"}</span>
              <span className="text-[12.5px] leading-snug">{renderInline(text)}</span>
            </div>
          );
        }
        return <p key={i} className="text-[12.5px] leading-snug">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={j}>{part}</span>
    )
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function RetailCopilot() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentPage = PAGE_LABELS[location.pathname] ?? "Dashboard";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || loading) return;
      setSuggestionsOpen(false);

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      const thinkingMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true };

      setMessages((prev) => [...prev, userMsg, thinkingMsg]);
      setInput("");
      setLoading(true);

      // Simulate brief delay
      setTimeout(() => {
        const reply = getHardcodedResponse(text.trim(), currentPage);
        setMessages((prev) =>
          prev.map((m) => (m.loading ? { ...m, content: reply, loading: false } : m))
        );
        setLoading(false);
      }, 600);
    },
    [loading, currentPage]
  );

  const explainPage = useCallback(() => {
    sendMessage(`Explain this dashboard page "${currentPage}" and give me 3 key strategic insights based on the current data.`);
  }, [currentPage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestionsOpen(true);
  };

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Open Retail Intelligence Copilot"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight">Copilot</span>
        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "w-[420px] max-w-[100vw]",
          open
            ? "h-[640px] max-h-[92vh] opacity-100 translate-y-0"
            : "h-0 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full m-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Insightly — Shopsy vs Meesho
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {currentPage}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Explain This Page */}
          <div className="px-4 py-2 border-b border-border/60 shrink-0 bg-muted/20">
            <button
              onClick={explainPage}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                "border border-dashed border-primary/40 text-primary/80 hover:bg-primary/8 hover:border-primary/70 hover:text-primary",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explain This Page
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-3">

                {showWelcome && (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Ask me about your retail data</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Grounded in live dashboard datasets
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 mr-2 mt-0.5 shrink-0">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[84%] rounded-xl px-3 py-2.5 text-[13px]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm text-[12.5px] leading-relaxed"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">Analyzing data\u2026</span>
                        </div>
                      ) : msg.role === "assistant" ? (
                        formatMessage(msg.content)
                      ) : (
                        <span className="text-[12.5px] leading-relaxed">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Suggested Questions */}
          {suggestionsOpen && showWelcome && (
            <div className="shrink-0 border-t border-border/60 bg-muted/10">
              <button
                onClick={() => setSuggestionsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium">Quick questions</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="px-3 pb-2 flex flex-col gap-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className={cn(
                      "text-left text-[11.5px] px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground",
                      "hover:bg-muted hover:text-foreground hover:border-border transition-all duration-150",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 py-3 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about pricing, promotions, availability\u2026"
                rows={2}
                className="flex-1 resize-none text-xs rounded-lg min-h-[44px] max-h-[120px] py-2.5 leading-relaxed border-border/70"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-lg shrink-0 mb-0.5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
              Answers based solely on dashboard datasets
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
