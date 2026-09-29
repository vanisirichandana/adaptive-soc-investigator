import { createFileRoute } from "@tanstack/react-router";
import { Brain, Database, GitBranch, Layers, Lock } from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — Adaptive SOC Investigator" },
      {
        name: "description",
        content:
          "Frontend, FastAPI-compatible service layer, Groq reasoning, Hindsight organizational memory and a persistent PostgreSQL record of every investigation.",
      },
      { property: "og:title", content: "Architecture — Adaptive SOC Investigator" },
      {
        property: "og:description",
        content: "How the interface, reasoning layer and memory layer fit together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const LAYERS = [
  {
    icon: Layers,
    title: "Interface layer",
    body: "Typed React application with the investigation workspace, alert triage, memory browser, analytics and activity log.",
    tags: ["React", "TypeScript", "Tailwind", "Recharts"],
  },
  {
    icon: GitBranch,
    title: "Service layer",
    body: "Server functions expose a FastAPI-compatible investigation contract. When FASTAPI_URL is configured, reasoning is delegated to that service; otherwise a deterministic fallback keeps the workflow complete.",
    tags: ["REST", "FASTAPI_URL", "Server functions"],
  },
  {
    icon: Brain,
    title: "Reasoning layer",
    body: "Groq-backed hypothesis evolution runs behind the service boundary so model credentials never reach the browser.",
    tags: ["GROQ_API_KEY", "Server-side only"],
  },
  {
    icon: Database,
    title: "Memory and persistence",
    body: "Alerts, evidence, investigations, hypotheses, recalls, decisions, outcomes and audit logs are stored in PostgreSQL. Retained experiences can additionally be pushed to Hindsight.",
    tags: ["PostgreSQL", "Row level security", "HINDSIGHT_API_URL"],
  },
];

function Architecture() {
  return (
    <SiteLayout>
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="System design"
            title="Interface, reasoning and memory stay separable"
            description="Every external dependency sits behind an environment-configured boundary, so the product runs with or without them."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="panel mb-10 p-8">
          <p className="mono-label">Request path</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-sm">
            {["Frontend", "FastAPI service", "Groq", "Hindsight", "PostgreSQL"].map((node, i, arr) => (
              <span key={node} className="flex items-center gap-3">
                <span className="rounded-lg border border-border bg-background/60 px-3 py-2">{node}</span>
                {i < arr.length - 1 ? <span className="text-primary">→</span> : null}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LAYERS.map((layer) => (
            <div key={layer.title} className="panel p-6">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <layer.icon className="size-4" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{layer.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {layer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-6 flex items-start gap-4 p-6">
          <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h3 className="text-base font-semibold">Credentials never reach the browser</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Model keys, memory service keys and privileged database credentials are read only on
              the server at request time. The browser holds a publishable key scoped by row level
              security policies.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
