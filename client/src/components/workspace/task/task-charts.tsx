import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getTaskDistributionsQueryFn } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Using tiny fallback charts with simple bars/circles to avoid new deps

function SimplePie({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 rounded-full overflow-hidden">
        {/* Render as stacked radial segments via conic-gradient */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `conic-gradient(${data
              .map((d, i) => {
                const from =
                  (data.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * 360;
                const to = ((data.slice(0, i + 1).reduce((s, x) => s + x.value, 0)) / total) * 360;
                return `${d.color} ${from}deg ${to}deg`;
              })
              .join(", ")})`,
          }}
        />
      </div>
      <div className="space-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.label}:</span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="text-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TaskCharts() {
  const workspaceId = useWorkspaceId();
  const { data, isPending } = useQuery({
    queryKey: ["task-distributions", workspaceId],
    queryFn: () => getTaskDistributionsQueryFn(workspaceId),
    enabled: !!workspaceId,
    staleTime: 0,
  });

  const byStatus = data?.byStatus || [];
  const byPriority = data?.byPriority || [];

  const colors: Record<string, string> = {
    TODO: "#94a3b8",
    IN_PROGRESS: "#60a5fa",
    IN_REVIEW: "#f59e0b",
    DONE: "#22c55e",
  };

  const pieData = byStatus.map((s) => ({
    label: s.status,
    value: s.count,
    color: colors[s.status] || "#64748b",
  }));

  const barData = byPriority.map((p) => ({ label: p.priority, value: p.count }));

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Task Distribution (Status)</CardTitle>
        </CardHeader>
        <CardContent>{isPending ? <div>Loading...</div> : <SimplePie data={pieData} />}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Priority Levels</CardTitle>
        </CardHeader>
        <CardContent>{isPending ? <div>Loading...</div> : <SimpleBar data={barData} />}</CardContent>
      </Card>
    </div>
  );
}