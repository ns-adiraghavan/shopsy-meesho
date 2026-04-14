import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "retail-datasets";

const FILES = [
  "price_tracking.json",
  "availability_tracking.json",
  "search_rank_tracking.json",
  "assortment_tracking.json",
];

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Build the origin from which to fetch the static JSON files.
  // The caller passes ?origin=https://your-app-url  OR we derive it from the Referer header.
  const url = new URL(req.url);
  const origin =
    url.searchParams.get("origin") ||
    (() => {
      const ref = req.headers.get("referer") ?? req.headers.get("origin") ?? "";
      try {
        const u = new URL(ref);
        return `${u.protocol}//${u.host}`;
      } catch {
        return "";
      }
    })();

  if (!origin) {
    return Response.json(
      { error: "Pass ?origin=https://your-app-url so the function knows where to fetch files from." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, string> = {};

  for (const file of FILES) {
    try {
      // Check if file already uploaded (skip if already there and upsert=false requested)
      const forceUpload = url.searchParams.get("force") === "true";
      if (!forceUpload) {
        const { data: existing } = await supabase.storage
          .from(BUCKET)
          .list("", { search: file });
        if (existing?.some((f) => f.name === file)) {
          results[file] = "already_exists";
          continue;
        }
      }

      // Fetch JSON from the deployed app's /data/ folder
      const res = await fetch(`${origin}/data/${file}`);
      if (!res.ok) {
        results[file] = `fetch_error: HTTP ${res.status}`;
        continue;
      }

      const blob = await res.blob();

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(file, blob, {
          contentType: "application/json",
          upsert: true,
        });

      results[file] = error ? `upload_error: ${error.message}` : "uploaded";
    } catch (err) {
      results[file] = `error: ${String(err)}`;
    }
  }

  return Response.json(
    { bucket: BUCKET, results },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
});
