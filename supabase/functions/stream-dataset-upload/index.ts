const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dataset-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "retail-datasets";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const datasetName = req.headers.get("x-dataset-name");
  if (!datasetName) {
    return Response.json(
      { error: "Missing x-dataset-name header (e.g. price_tracking.json)" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Proxy the request body stream directly to Supabase Storage REST API.
  // This avoids buffering the entire file in the edge function memory.
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${datasetName}`;

  const storageRes = await fetch(storageUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    // @ts-ignore – duplex is required for streaming request bodies in Deno fetch
    duplex: "half",
    body: req.body,
  });

  const result = await storageRes.json().catch(() => ({}));

  if (!storageRes.ok) {
    return Response.json(
      { error: "Storage upload failed", detail: result },
      { status: storageRes.status, headers: corsHeaders }
    );
  }

  return Response.json(
    { success: true, file: datasetName, storage: result },
    { headers: corsHeaders }
  );
});
