import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, PanelSkeleton, StatCard } from "@/components/app/bits";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/soc";
import { ExperienceDialog } from "./investigations.$id";

export const Route = createFileRoute("/_authenticated/hindsight")({
  head: () => ({
    meta: [
      { title: "Organizational memory — Adaptive SOC Investigator" },
      { name: "description", content: "Every investigation becomes an experience that future investigations can recall." },
      { property: "og:title", content: "Organizational memory — Adaptive SOC Investigator" },
      { property: "og:description", content: "Search retained investigation experiences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hindsight,
});

function Hindsight() {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hindsight", term],
    queryFn: async () => {
      let query = supabase
        .from("hindsight_experiences")
        .select("*")
        .order("created_at", { ascending: false });
      if (term.trim()) {
        const like = `%${term.trim()}%`;
        query = query.or(`ref.ilike.${like},summary.ilike.${like},investigation_type.ilike.${like}`);
      }
      const [experiences, recalls] = await Promise.all([
        query.limit(100),
        supabase.from("hindsight_recalls").select("similarity"),
      ]);
      if (experiences.error) throw experiences.error;
      const all = await supabase.from("hindsight_experiences").select("investigation_type");
      const types = all.data ?? [];
      const sims = recalls.data ?? [];
      return {
        rows: experiences.data,
        total: types.length,
        credential: types.filter((t) => t.investigation_type === "credential").length,
        endpoint: types.filter((t) => t.investigation_type === "endpoint").length,
        authentication: types.filter((t) => t.investigation_type === "authentication").length,
        avgRelevance: sims.length
          ? Math.round(sims.reduce((sum, r) => sum + Number(r.similarity), 0) / sims.length)
          : null,
      };
    },
  });

  return (
    <AppShell
      title="Organizational memory"
      subtitle="Every investigation becomes an experience."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total experiences" value={data?.total ?? 0} tone="ai" loading={isLoading} />
        <StatCard label="Credential cases" value={data?.credential ?? 0} loading={isLoading} />
        <StatCard label="Endpoint cases" value={data?.endpoint ?? 0} loading={isLoading} />
        <StatCard label="Authentication cases" value={data?.authentication ?? 0} loading={isLoading} />
        <StatCard
          label="Avg recall relevance"
          value={data?.avgRelevance !== null && data?.avgRelevance !== undefined ? `${data.avgRelevance}%` : "—"}
          tone="success"
          hint={data?.avgRelevance === null ? "No recalls yet" : "Across all recalls"}
          loading={isLoading}
        />
      </div>

      <div className="panel mt-6 p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search experiences by reference, type or summary"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <PanelSkeleton rows={6} />
        ) : data?.rows.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.rows.map((experience) => (
              <button
                key={experience.id}
                onClick={() => setOpen(experience.id)}
                className="panel p-5 text-left transition-colors hover:border-ai/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ai">{experience.ref}</span>
                  <span className="mono-label">{experience.investigation_type}</span>
                </div>
                <p className="mt-2 text-sm">{experience.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(experience.evidence_pattern ?? []).slice(0, 4).map((token: string) => (
                    <span
                      key={token}
                      className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {token}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {experience.analyst_decision} · {experience.outcome} ·{" "}
                  {formatDateTime(experience.created_at)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No experiences found"
            description="Complete an investigation to add the first experience to organizational memory."
          />
        )}
      </div>

      <ExperienceDialog id={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
