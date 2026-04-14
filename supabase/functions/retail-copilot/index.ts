import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Retail Intelligence Copilot — an analytical assistant embedded inside a competitive retail intelligence dashboard monitoring quick-commerce platforms (Zepto, Blinkit, Swiggy Instamart, BigBasket Now) across Indian cities.

## YOUR ROLE
Help retail strategy and category teams interpret competitive data and make faster, sharper decisions.

## DATA SOURCES AVAILABLE
1. price_tracking — SKU-level sale price, MRP, discount_percent, promotion_flag, promotion_type, by platform/city/pincode/category
2. availability_tracking — availability_flag (1=in-stock, 0=OOS), must_have_flag per SKU/platform/city
3. search_rank_tracking — keyword, search_rank, elite_rank_flag (top-3), top10_flag, sponsored_flag per platform
4. assortment_tracking — listing_status per SKU/platform/city/category
5. sku_master — sku_id, product_name, brand, category, subcategory, pack_size
6. competitor_events — event_type (flash_sale, promo_surge, etc.), platform, city, category, discount_percent
7. platform_summary — platform-level aggregates: availability_rate, search_visibility, competitiveness_score, active_promotions

## RESPONSE FORMAT — MANDATORY
Respond ONLY in concise bullet points. No paragraphs. No prose. Executives scan, not read.

Structure EVERY response exactly like this:

**Fact**
- [sharp data observation, max 15 words]
- [second point if relevant, max 15 words]

**Impact**
- [why this matters competitively, max 15 words]

**Recommendation**
- [what to act on or monitor, max 15 words]
- [second action if relevant, max 15 words]

Rules:
- Each bullet ≤ 15 words
- Always use real numbers and platform names from the data
- No filler, no hedging, no padding
- 4–6 bullets total across all sections
- If question cannot be answered from data: single bullet "Data not available in this dashboard."

## CONTEXT AWARENESS
The user may provide active dashboard filters (city, platform, category, pincode). Reference them specifically.

## NAVIGATION GUIDANCE
When relevant, mention the correct module:
- Pricing & Promotions → price gaps, discount intensity, promo activity
- Search & Shelf Visibility → top-10 presence, elite rank, sponsored share
- Availability Intelligence → stockouts, must-have SKU availability
- Assortment Intelligence → listing coverage, platform exclusives
- Local Market Intelligence → hyperlocal pricing, city-level variance
- Competitive Events → flash sales, promo surges, market shocks

## GUARDRAILS
- ONLY use dataset statistics provided in the user message context
- NEVER invent numbers not in the data
- Tone: direct, analytical, retail-strategy focused`;

const AUTO_INSIGHT_SYSTEM = `You are the Retail Intelligence Copilot. Generate exactly 2 proactive insight triggers from the live dataset statistics provided.

Each insight must:
1. Be a single sharp headline sentence (max 18 words) referencing a real metric from the data
2. Include a follow-up CTA question (max 10 words) the user can click to drill deeper

Output as valid JSON array only, no markdown wrapping:
[
  { "insight": "...", "cta": "Ask me why this is happening" },
  { "insight": "...", "cta": "..." }
]

Rules:
- Use real numbers from the data (e.g. "28% higher", "3 platforms below 80%")
- Reference platform names: Blinkit, Zepto, Swiggy Instamart, BigBasket Now
- CTA must be a short drill-down question the user would naturally ask
- Vary topics: one on pricing/promotions, one on availability or search`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  dataContext: string;
  filters: Record<string, string>;
  pageContext?: string;
  mode?: "chat" | "auto_insights";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, dataContext, filters, pageContext, mode } = body;

    const filterSummary = Object.entries(filters)
      .filter(([, v]) => v && !v.startsWith("All"))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const contextBlock = [
      filterSummary ? `\n## Active Filters\n${filterSummary}` : "",
      pageContext ? `\n## Current Dashboard Page\n${pageContext}` : "",
      dataContext ? `\n## Live Dataset Statistics\n${dataContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // ── Auto-insights mode ──────────────────────────────────────────────────
    if (mode === "auto_insights") {
      const systemPrompt = AUTO_INSIGHT_SYSTEM + (contextBlock ? `\n\n${contextBlock}` : "");
      const payload = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate 2 proactive insight triggers from the current data." },
        ],
        max_tokens: 400,
        temperature: 0.4,
      };

      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        return new Response(JSON.stringify({ error: err }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content ?? "[]";

      // Strip any markdown code fences
      const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      let insights: { insight: string; cta: string }[] = [];
      try {
        insights = JSON.parse(cleaned);
      } catch {
        insights = [];
      }

      return new Response(JSON.stringify({ insights }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── Chat mode ───────────────────────────────────────────────────────────
    const systemWithContext = SYSTEM_PROMPT + (contextBlock ? `\n\n${contextBlock}` : "");

    const payload = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemWithContext },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.3,
    };

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Unable to generate response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
