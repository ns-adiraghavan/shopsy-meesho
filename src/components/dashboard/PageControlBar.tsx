// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Bell } from "lucide-react";
import { AlertBuilderModal, AlertRule } from "./AlertBuilderModal";
import { exportToCSV } from "@/lib/csvExport";
import { Badge } from "@/components/ui/badge";

interface Props {
  /** Label shown in the export filename, e.g. "price_tracking" */
  exportLabel: string;
  /** The filtered dataset rows to export — pass whatever the page is using */
  exportData: Record<string, unknown>[];
}

export function PageControlBar({ exportLabel, exportData }: Props) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  const handleExport = () => {
    exportToCSV(exportData, exportLabel);
  };

  const handleSaveAlert = (rule: AlertRule) => {
    setAlerts((prev) => [rule, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2 px-4 lg:px-6 pt-4 pb-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-7 text-xs gap-1.5 border-border hover:bg-muted/60"
          disabled={exportData.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
          {exportData.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px] font-normal">
              {exportData.length.toLocaleString()}
            </Badge>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAlertsOpen(true)}
          className="h-7 text-xs gap-1.5 border-border hover:bg-muted/60"
        >
          <Bell className="h-3.5 w-3.5" />
          Alert Builder
          {alerts.length > 0 && (
            <Badge className="ml-0.5 h-4 px-1 text-[10px] font-normal bg-primary text-primary-foreground">
              {alerts.length}
            </Badge>
          )}
        </Button>
      </div>

      <AlertBuilderModal
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alerts={alerts}
        onSave={handleSaveAlert}
        onDelete={handleDeleteAlert}
      />
    </>
  );
}
