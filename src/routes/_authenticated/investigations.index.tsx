import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton, SeverityBadge, StatusBadge } from "@/components/app/bits";
import { formatDateTime, riskTone } from "@/lib/soc";

export const Route = createFileRoute("/_authenticated/investigations/")({
  head: () => ({
    meta: [
      { title: "Investigations — Adaptive SOC Investigator" },
      { name: "description", content: "Open and completed SOC investigations with AI state, confidence and analyst outcome." },
      { property: "og:title", content: "Investigations — Adaptive SOC Investigator" },
      { property: "og:description", content: "Track every investigation from alert to retained experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Investigations,
});

function Investigations() {
  const { data, isLoading } = useQuery({
    queryKey: ["investigations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investigations")
        .select("*, alerts(ref, title, severity, risk_score, actor_user)")
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title="Investigations"
      subtitle="Each investigation ends with an analyst decision and a retained experience."
    >
      {isLoading ? (
        <PanelSkeleton rows={6} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((investigation) => {
            const alert = investigation.alerts as {
              title?: string;
              severity?: string;
              risk_score?: number;
              actor_user?: string;
            } | null;
            return (
              <Link
                key={investigation.id}
                to="/investigations/$id"
                params={{ id: investigation.id }}
                className="panel block p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-primary">{investigation.ref}</span>
                  <StatusBadge status={investigation.status} />
                </div>
                <p className="mt-2 text-sm font-medium">{alert?.title ?? "Investigation"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {alert?.severity ? <SeverityBadge severity={alert.severity} /> : null}
                  <span className={`font-mono ${riskTone(alert?.risk_score ?? 0)}`}>
                    risk {alert?.risk_score ?? "—"}
                  </span>
                  <span>{alert?.actor_user}</span>
                  <span>opened {formatDateTime(investigation.opened_at)}</span>
                  {investigation.confidence ? (
                    <span className="text-ai">AI confidence {investigation.confidence}%</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No investigations yet"
          description="Open an alert from the triage queue to start the first investigation."
        />
      )}
    </AppShell>
  );
}
