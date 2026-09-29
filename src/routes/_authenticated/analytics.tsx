import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton } from "@/components/app/bits";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Adaptive SOC Investigator" },
      { name: "description", content: "Alert severity mix, investigation categories, analyst decisions and memory growth." },
      { property: "og:title", content: "Analytics — Adaptive SOC Investigator" },
      { property: "og:description", content: "Measured from stored investigation data, never fabricated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--critical)",
  high: "var(--warning)",
  medium: "var(--primary)",
  low: "var(--muted-foreground)",
};

function ChartPanel({
  title,
  description,
  hasData,
  children,
}: {
  title: string;
  description: string;
  hasData: boolean;
  children: React.ReactElement;
}) {
  return (
    <div className="panel p-5">
      <p className="mono-label">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Not enough data yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [alerts, investigations, decisions, recalls, experiences] = await Promise.all([
        supabase.from("alerts").select("severity"),
        supabase.from("investigations").select("category, status"),
        supabase.from("analyst_decisions").select("decision"),
        supabase.from("hindsight_recalls").select("similarity, created_at"),
        supabase.from("hindsight_experiences").select("created_at"),
      ]);

      const count = <T extends string>(rows: Array<Record<string, unknown>>, key: string) => {
        const map = new Map<T, number>();
        for (const row of rows) {
          const value = (row[key] as T) ?? ("unknown" as T);
          map.set(value, (map.get(value) ?? 0) + 1);
        }
        return [...map.entries()].map(([name, value]) => ({ name, value }));
      };

      const byMonth = new Map<string, number>();
      for (const row of experiences.data ?? []) {
        const key = new Date(row.created_at).toLocaleDateString([], {
          month: "short",
          year: "2-digit",
        });
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      }

      return {
        severity: count(alerts.data ?? [], "severity"),
        categories: count(investigations.data ?? [], "category"),
        decisions: count(decisions.data ?? [], "decision"),
        recallCount: (recalls.data ?? []).length,
        recalls: (recalls.data ?? []).map((row, index) => ({
          name: `#${index + 1}`,
          similarity: Number(row.similarity),
        })),
        retention: [...byMonth.entries()].map(([name, value]) => ({ name, value })),
      };
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Analytics" subtitle="Calculated from stored investigation data.">
        <PanelSkeleton rows={8} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Analytics"
      subtitle="Every figure is calculated from stored investigation data."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Alerts by severity"
          description="Distribution across the full alert queue"
          hasData={Boolean(data?.severity.length)}
        >
          <PieChart>
            <Pie
              data={data?.severity ?? []}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
            >
              {(data?.severity ?? []).map((entry) => (
                <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "var(--primary)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ChartPanel>

        <ChartPanel
          title="Investigations by category"
          description="Where analyst time is being spent"
          hasData={Boolean(data?.categories.length)}
        >
          <BarChart data={data?.categories ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Analyst decisions"
          description="Confirmed, rejected and modified AI assessments"
          hasData={Boolean(data?.decisions.length)}
        >
          <BarChart data={data?.decisions ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="var(--ai)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Hindsight recall relevance"
          description="Similarity of each experience recalled during investigations"
          hasData={Boolean(data?.recalls.length)}
        >
          <LineChart data={data?.recalls ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="similarity" stroke="var(--ai)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartPanel>
      </div>

      <div className="mt-4">
        {data?.retention.length ? (
          <ChartPanel
            title="Experiences retained over time"
            description="Growth of organizational memory"
            hasData
          >
            <BarChart data={data.retention}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartPanel>
        ) : (
          <EmptyState
            title="No retained experiences yet"
            description="Complete an investigation to start charting memory growth."
          />
        )}
      </div>
    </AppShell>
  );
}
