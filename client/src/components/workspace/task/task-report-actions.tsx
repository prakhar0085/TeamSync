import { Button } from "@/components/ui/button";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { downloadAllUsersTaskReport, downloadDetailedTaskReport } from "@/lib/api";
import { useState } from "react";

export default function TaskReportActions() {
  const workspaceId = useWorkspaceId();
  const [downloading, setDownloading] = useState<null | "all" | "detailed">(null);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleAll = async () => {
    try {
      setDownloading("all");
      const blob = await downloadAllUsersTaskReport(workspaceId);
      triggerDownload(blob, `workspace-${workspaceId}-all-tasks.csv`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDetailed = async () => {
    try {
      setDownloading("detailed");
      const blob = await downloadDetailedTaskReport(workspaceId);
      triggerDownload(blob, `workspace-${workspaceId}-detailed-tasks.csv`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleAll} disabled={!workspaceId || downloading !== null}>
        {downloading === "all" ? "Downloading..." : "Download All Users Task Report"}
      </Button>
      <Button variant="outline" onClick={handleDetailed} disabled={!workspaceId || downloading !== null}>
        {downloading === "detailed" ? "Downloading..." : "Download Detailed Task Report"}
      </Button>
    </div>
  );
}