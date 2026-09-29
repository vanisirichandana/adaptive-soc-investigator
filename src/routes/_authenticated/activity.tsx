import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton } from "@/components/app/bits";
import { formatDateTime } from "@/lib/soc";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity log — Adaptive SOC Investigator" },
      { name: "description", content: "Immutable audit trail of every alert, investigation, decision and retained experience." },
      { property: "og:title", content: "Activity log — Adaptive SOC Investigator" },
      { property: "og:description", content: "Full audit trail of SOC activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="Activity" subtitle="Audit trail of every meaningful action in the platform.">
      {isLoading ? (
        <PanelSkeleton rows={8} />
      ) : data && data.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Timestamp", "Analyst", "Action", "Entity", "Description"].map((head) => (
                  <th key={head} className="mono-label px-4 py-3 font-normal">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">{log.actor_name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.entity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No activity yet" description="Actions you take will be recorded here." />
      )}
    </AppShell>
  );
}
