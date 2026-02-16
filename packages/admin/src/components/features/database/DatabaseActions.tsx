import { Search, Download, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  onAction: (action: string) => void;
  loading?: boolean;
}

export function DatabaseActions({ onAction, loading }: Props) {
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <Button onClick={() => onAction("view-schema")} icon={Search} loading={loading}>
        View Schema
      </Button>
      <Button onClick={() => onAction("export-data")} icon={Download} loading={loading}>
        Export Data
      </Button>
      <Button
        onClick={() => onAction("clear-logs")}
        icon={Trash2}
        variant="danger"
        loading={loading}
      >
        Clear Logs
      </Button>
      <Button onClick={() => onAction("refresh")} icon={RefreshCw} loading={loading}>
        Refresh
      </Button>
    </div>
  );
}
