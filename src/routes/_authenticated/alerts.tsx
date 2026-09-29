import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton, SeverityBadge, StatusBadge } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime, riskTone } from "@/lib/soc";
import { openInvestigationForAlert } from "@/lib/open-investigation";

const FILTERS = ["all", "critical", "high", "medium", "low"] as const;

export const Route = createFileRoute("/_authenticated/alerts")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Alerts — Adaptive SOC Investigator" },
      { name: "description", content: "Triage queue of security alerts with severity, risk score and investigation status." },
      { property: "og:title", content: "Alerts — Adaptive SOC Investigator" },
      { property: "og:description", content: "Triage the SOC alert queue and open investigations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["alerts", q, filter],
    queryFn: async () => {
      let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("severity", filter);
      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(
          `ref.ilike.${like},title.ilike.${like},actor_user.ilike.${like},source.ilike.${like},device.ilike.${like},source_ip.ilike.${like}`,
        );
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  async function investigate(alertId: string) {
    setOpeningId(alertId);
    try {
      const investigationId = await openInvestigationForAlert(alertId);
      navigate({ to: "/investigations/$id", params: { id: investigationId } });
    } catch (error) {
      setOpeningId(null);
      toast.error(error instanceof Error ? error.message : "Could not open the investigation");
    }
  }

  return (
    <AppShell title="Alerts" subtitle="Detections awaiting triage, investigation or closure.">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="relative min-w-60 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ to: "/alerts", search: { q: term } });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by ID, title, identity, device or IP"
              className="pl-9"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={filter === option ? "default" : "outline"}
                onClick={() => setFilter(option)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <PanelSkeleton rows={6} />
        ) : data && data.length > 0 ? (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["ID", "Alert", "Source", "User", "Severity", "Risk", "Created", "Status", ""].map(
                    (head) => (
                      <th key={head} className="mono-label px-4 py-3 font-normal">
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary">{alert.ref}</td>
                    <td className="max-w-70 px-4 py-3">
                      <p className="truncate">{alert.title}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{alert.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">{alert.actor_user}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className={`px-4 py-3 font-mono ${riskTone(alert.risk_score)}`}>
                      {alert.risk_score}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(alert.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={openingId === alert.id}
                        onClick={() => investigate(alert.id)}
                      >
                        {openingId === alert.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                        Investigate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No alerts match this view"
            description="Try a different severity filter or clear the search term."
          />
        )}
      </div>
    </AppShell>
  );
}
