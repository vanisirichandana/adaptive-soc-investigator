import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton, SeverityBadge, StatCard, StatusBadge } from "@/components/app/bits";
import { formatDateTime, relativeTime, riskTone } from "@/lib/soc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command center — Adaptive SOC Investigator" },
      { name: "description", content: "Live SOC overview: alert volume, risk, active investigations and organizational memory." },
      { property: "og:title", content: "Command center — Adaptive SOC Investigator" },
      { property: "og:description", content: "Live SOC overview and adaptive investigation activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [alerts, experiences, investigations, recalls, logs] = await Promise.all([
        supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("hindsight_experiences").select("id", { count: "exact", head: true }),
        supabase
          .from("investigations")
          .select("*, alerts(ref, title, severity, risk_score)")
          .order("opened_at", { ascending: false })
          .limit(50),
        supabase
          .from("hindsight_recalls")
          .select("*, hindsight_experiences(ref, investigation_type), investigations(ref)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
      ]);

      const allAlerts = alerts.data ?? [];
      const activeAlerts = allAlerts.filter((a) => a.status !== "closed");
      const activeInvestigations = (investigations.data ?? []).filter(
        (i) => i.status !== "completed",
      );

      const byDay = new Map<string, { day: string; critical: number; high: number; other: number }>();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toLocaleDateString([], { month: "short", day: "numeric" });
        byDay.set(key, { day: key, critical: 0, high: 0, other: 0 });
      }
      for (const alert of allAlerts) {
        const key = new Date(alert.created_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
        const row = byDay.get(key);
        if (!row) continue;
        if (alert.severity === "critical") row.critical += 1;
        else if (alert.severity === "high") row.high += 1;
        else row.other += 1;
      }

      return {
        activeAlerts: activeAlerts.length,
        highRisk: activeAlerts.filter((a) => a.risk_score >= 80).length,
        activeInvestigations: activeInvestigations.length,
        experiences: experiences.count ?? 0,
        chart: [...byDay.values()],
        investigations: activeInvestigations.slice(0, 5),
        recentAlerts: activeAlerts.slice(0, 6),
        recalls: recalls.data ?? [],
        logs: logs.data ?? [],
      };
    },
  });

  return (
    <AppShell
      title="Command center"
      subtitle="Every investigation makes the next investigation smarter."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active alerts" value={data?.activeAlerts ?? 0} loading={isLoading} />
        <StatCard
          label="High risk"
          value={data?.highRisk ?? 0}
          tone="critical"
          hint="Risk score 80 or above"
          loading={isLoading}
        />
        <StatCard
          label="Active investigations"
          value={data?.activeInvestigations ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="Hindsight experiences"
          value={(data?.experiences ?? 0).toLocaleString()}
          tone="ai"
          hint="Retained organizational memory"
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Threat activity</p>
              <p className="mt-1 text-sm text-muted-foreground">Alert volume by severity, last 7 days</p>
            </div>
          </div>
          <div className="mt-5 h-64">
            {isLoading ? (
              <PanelSkeleton rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chart ?? []}>
                  <defs>
                    <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="critical" stroke="var(--critical)" fill="url(#gradCritical)" />
                  <Area type="monotone" dataKey="high" stroke="var(--warning)" fill="url(#gradHigh)" />
                  <Area type="monotone" dataKey="other" stroke="var(--primary)" fill="url(#gradOther)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <p className="mono-label">Active investigations</p>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <PanelSkeleton rows={3} />
            ) : data?.investigations.length ? (
              data.investigations.map((investigation) => (
                <Link
                  key={investigation.id}
                  to="/investigations/$id"
                  params={{ id: investigation.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary">{investigation.ref}</p>
                    <p className="mt-0.5 truncate text-sm">
                      {(investigation.alerts as { title?: string } | null)?.title ?? "Investigation"}
                    </p>
                  </div>
                  <StatusBadge status={investigation.status} />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active investigations.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="mono-label">Recent alerts</p>
            <Link
              to="/alerts"
              search={{ q: "" }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <PanelSkeleton rows={4} />
            ) : data?.recentAlerts.length ? (
              data.recentAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  search={{ q: alert.ref }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">{alert.ref}</span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="mt-1 truncate text-sm">{alert.title}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm ${riskTone(alert.risk_score)}`}>{alert.risk_score}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {relativeTime(alert.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState title="No alerts" description="Nothing is currently awaiting triage." />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="mono-label">Recent Hindsight recalls</p>
            <div className="mt-4 space-y-2">
              {data?.recalls.length ? (
                data.recalls.map((recall) => (
                  <div key={recall.id} className="rounded-lg border border-ai/25 bg-ai/8 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-ai">
                        {(recall.hindsight_experiences as { ref?: string } | null)?.ref ?? "Experience"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {Number(recall.similarity)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      recalled for {(recall.investigations as { ref?: string } | null)?.ref ?? "an investigation"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recalls yet. Run an AI investigation to consult organizational memory.
                </p>
              )}
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="mono-label">Analyst activity</p>
              <Link to="/activity" className="text-xs text-primary hover:underline">
                Full log
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.logs.length ? (
                data.logs.map((log) => (
                  <div key={log.id} className="text-xs">
                    <p className="text-foreground">
                      <span className="font-mono text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </span>{" "}
                      · {log.actor_name}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{log.description ?? log.action}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
