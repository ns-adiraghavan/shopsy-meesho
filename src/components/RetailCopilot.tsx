// @ts-nocheck
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
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GlobalFilters } from "@/data/dataLoader";
import { buildDataContext, buildPageContext } from "@/hooks/useCopilotData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface AutoInsight {
  insight: string;
  cta: string;
}

const SUGGESTED_QUESTIONS = [
  "Which platform is most aggressive on promotions?",
  "Why is Bangalore the most competitive city?",
  "Which platform dominates search visibility?",
  "Are there unusual promotional events this week?",
];

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Competitive Overview",
  "/dashboard/pricing": "Pricing & Promotions",
  "/dashboard/search": "Search & Shelf Visibility",
  "/dashboard/assortment": "Assortment Intelligence",
  "/dashboard/availability": "Availability Intelligence",
  "/dashboard/local": "Local Market Intelligence",
  "/dashboard/events": "Competitive Events",
};

/** Renders markdown-style bullet lists and bold text */
function formatMessage(content: string) {
  const lines = content.split("\n").filter((l, i, arr) => {
    // Collapse more than one consecutive blank line
    if (l.trim() === "" && arr[i - 1]?.trim() === "") return false;
    return true;
  });

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Bold section headers like **Fact**
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={i} className="text-[11px] font-bold text-primary/80 uppercase tracking-wider mt-2 mb-0.5 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        // Bullet lines starting with - or •
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const text = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary/60 mt-[3px] shrink-0 text-[10px]">▸</span>
              <span className="text-[12.5px] leading-snug">{renderInline(text)}</span>
            </div>
          );
        }

        // Regular text
        return (
          <p key={i} className="text-[12.5px] leading-snug">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={j}>{part}</span>
    )
  );
}

interface RetailCopilotProps {
  filters: GlobalFilters;
}

export function RetailCopilot({ filters }: RetailCopilotProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [autoInsights, setAutoInsights] = useState<AutoInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentPage = PAGE_LABELS[location.pathname] ?? "Dashboard";
  const pageContext = buildPageContext(location.pathname);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Fetch auto-insights when panel opens (only if no messages yet)
  useEffect(() => {
    if (!open || messages.length > 0 || autoInsights.length > 0 || insightsLoading) return;

    const fetchInsights = async () => {
      setInsightsLoading(true);
      try {
        const dataContext = buildDataContext(filters);
        const filterPayload: Record<string, string> = {
          city: filters.city,
          platform: filters.platform,
          category: filters.category,
          pincode: filters.pincode,
        };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        const res = await fetch(`${supabaseUrl}/functions/v1/retail-copilot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            messages: [],
            dataContext,
            filters: filterPayload,
            pageContext,
            mode: "auto_insights",
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.insights) && json.insights.length > 0) {
            setAutoInsights(json.insights);
          }
        }
      } catch {
        // Silently fail — insights are optional
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchInsights();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setSuggestionsOpen(false);

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      const thinkingMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, thinkingMsg]);
      setInput("");
      setLoading(true);

      try {
        const dataContext = buildDataContext(filters);
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const filterPayload: Record<string, string> = {
          city: filters.city,
          platform: filters.platform,
          category: filters.category,
          pincode: filters.pincode,
        };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase configuration.");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        let res: Response;
        try {
          res = await fetch(`${supabaseUrl}/functions/v1/retail-copilot`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              messages: history,
              dataContext,
              filters: filterPayload,
              pageContext,
              mode: "chat",
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(`[${res.status}] ${errText}`);
        }

        const json = await res.json();
        const reply = json?.reply ?? "Unable to generate a response. Please try again.";
        setMessages((prev) =>
          prev.map((m) => (m.loading ? { ...m, content: reply, loading: false } : m))
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[RetailCopilot] fetch error:", message);
        setMessages((prev) =>
          prev.map((m) =>
            m.loading
              ? { ...m, content: `Unable to reach the AI. Error: ${message}`, loading: false }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, messages, pageContext, loading]
  );

  const explainPage = useCallback(() => {
    sendMessage(
      `Explain this dashboard page "${currentPage}" and give me 3 key strategic insights based on the current data.`
    );
  }, [currentPage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAutoInsights([]);
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
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Retail Intelligence Copilot
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {currentPage}
                {filters.city !== "All Cities" && (
                  <span className="text-primary/80"> · {filters.city}</span>
                )}
                {filters.platform !== "All Platforms" && (
                  <span className="text-primary/80"> · {filters.platform}</span>
                )}
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

          {/* ── Explain This Page button ── */}
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

          {/* ── Messages ── */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-3">

                {/* Welcome state */}
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

                {/* ── Auto-insight triggers ── */}
                {showWelcome && (
                  <div className="flex flex-col gap-2">
                    {insightsLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/50">
                        <Zap className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                        <span className="text-[11.5px] text-muted-foreground">Generating live insights…</span>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
                      </div>
                    ) : (
                      autoInsights.map((ins, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-2"
                        >
                          <div className="flex gap-2 items-start">
                            <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[12px] font-medium text-foreground leading-snug">
                              {ins.insight}
                            </p>
                          </div>
                          <button
                            onClick={() => sendMessage(ins.cta)}
                            disabled={loading}
                            className={cn(
                              "self-start text-[11px] text-primary font-medium px-2.5 py-1 rounded-md",
                              "bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20",
                              loading && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {ins.cta} →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
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
                          <span className="text-muted-foreground text-xs">Analyzing data…</span>
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

          {/* ── Suggested Questions ── */}
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

          {/* ── Input ── */}
          <div className="shrink-0 px-3 py-3 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about pricing, promotions, availability…"
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
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
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
