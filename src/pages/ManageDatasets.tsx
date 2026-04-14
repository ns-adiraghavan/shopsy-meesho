// @ts-nocheck
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

const DATASETS = [
  { key: "price_tracking.json",        label: "Price Tracking",        description: "SKU-level pricing, discounts & promotions per platform, city & pincode" },
  { key: "availability_tracking.json", label: "Availability Tracking", description: "SKU availability flags per platform & city" },
  { key: "search_rank_tracking.json",  label: "Search Rank Tracking",  description: "Keyword search ranks & visibility scores" },
  { key: "assortment_tracking.json",   label: "Assortment Tracking",   description: "SKU listing status per platform & city" },
  { key: "sku_master.json",            label: "SKU Master",            description: "Master list of all SKUs with metadata (name, brand, category, etc.)" },
  { key: "competitor_events.json",     label: "Competitor Events",     description: "Competitor promotional and pricing event records" },
  { key: "platform_summary.json",      label: "Platform Summary",      description: "Aggregated platform-level availability, search visibility & competitiveness scores" },
];

type UploadState = "idle" | "uploading" | "done" | "error";

interface DatasetStatus {
  state: UploadState;
  message?: string;
  size?: number;
}

export default function ManageDatasets() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, DatasetStatus>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setStatus = (key: string, update: DatasetStatus) =>
    setStatuses((prev) => ({ ...prev, [key]: update }));

  const handleFileSelect = async (datasetKey: string, file: File) => {
    setStatus(datasetKey, { state: "uploading", size: file.size });

    try {
      const FUNCTIONS_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;
      const res = await fetch(`${FUNCTIONS_URL}/stream-dataset-upload`, {
        method: "POST",
        headers: {
          "x-dataset-name": datasetKey,
          "Content-Type": "application/json",
        },
        body: file,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      setStatus(datasetKey, {
        state: "done",
        size: file.size,
        message: `Uploaded ${(file.size / 1_000_000).toFixed(1)} MB`,
      });

      // Clear the in-memory dataset cache so the new file is fetched on next load
      localStorage.setItem(`dataset_version_${datasetKey}`, Date.now().toString());
    } catch (err) {
      setStatus(datasetKey, {
        state: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Manage Datasets</h1>
            <p className="text-sm text-muted-foreground">
              Upload updated JSON datasets directly to cloud storage
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="space-y-3">
        {DATASETS.map((dataset) => {
          const status = statuses[dataset.key];
          const isUploading = status?.state === "uploading";

          return (
            <Card key={dataset.key} className="bg-gradient-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{dataset.label}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{dataset.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {status?.state === "done" && (
                      <Badge className="bg-status-low/20 text-status-low border border-status-low/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {status.message}
                      </Badge>
                    )}
                    {status?.state === "error" && (
                      <Badge className="bg-status-critical/20 text-status-critical border border-status-critical/30 gap-1">
                        <AlertCircle className="h-3 w-3" /> {status.message}
                      </Badge>
                    )}
                    {isUploading && (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[dataset.key]?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {status?.state === "done" ? "Replace" : "Upload"}
                    </Button>
                    <input
                      ref={(el) => (fileInputRefs.current[dataset.key] = el)}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(dataset.key, file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono text-muted-foreground">{dataset.key}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Files are streamed directly to cloud storage. Large files (100MB+) are supported.
        After uploading, refresh the dashboard to load the new data.
      </p>
    </div>
  );
}
