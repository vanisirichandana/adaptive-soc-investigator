import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Brain,
  CheckCircle2,
  Database,
  GitBranch,
  History,
  Layers,
  Lock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Adaptive SOC Investigator — Investigations with organizational memory" },
      {
        name: "description",
        content:
          "AI-assisted SOC investigation platform that recalls previous investigation experience so every alert is analysed with what the organization already learned.",
      },
      {
        property: "og:title",
        content: "Adaptive SOC Investigator — Every investigation makes the next one smarter",
      },
      {
        property: "og:description",
        content:
          "Alert, recall, investigate, decide, retain, adapt. AI recommends, the analyst decides.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FLOW = [
  { label: "Alert", icon: Bell },
  { label: "AI Investigation", icon: Brain },
  { label: "Hindsight Memory", icon: History },
  { label: "Analyst Decision", icon: UserCheck },
  { label: "Organizational Learning", icon: Sparkles },
];

const STEPS = [
  { n: "01", t: "Alert", d: "Security telemetry is correlated into a prioritised alert with a risk score." },
  { n: "02", t: "Recall", d: "Relevant previous investigation experiences are retrieved from organizational memory." },
  { n: "03", t: "Investigate", d: "Current evidence is analysed alongside what the SOC already learned." },
  { n: "04", t: "Decide", d: "The analyst confirms, rejects or modifies the assessment — with a reason." },
  { n: "05", t: "Retain", d: "The decision and outcome are stored as a reusable experience." },
  { n: "06", t: "Adapt", d: "The next comparable alert starts from a sharper hypothesis." },
];

function Landing() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mono-label inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-success animate-soc-pulse" />
              Adaptive investigation platform
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Every investigation makes the next one smarter.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              AI-powered security investigation with organizational memory.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Launch Investigator <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Explore How It Works
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-3 md:grid-cols-5">
            {FLOW.map((step, i) => (
              <div
                key={step.label}
                className="panel animate-rise flex items-center gap-3 p-4 md:flex-col md:items-start md:gap-4"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <span
                  className={`grid size-9 place-items-center rounded-lg ${
                    i === 2 ? "bg-ai/15 text-ai" : "bg-primary/12 text-primary"
                  }`}
                >
                  <step.icon className="size-4" />
                </span>
                <div>
                  <p className="mono-label">Stage 0{i + 1}</p>
                  <p className="mt-1 text-sm font-medium">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why adaptive */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading
          eyebrow="Why adaptive"
          title="Most tools investigate the alert in front of them"
          description="Adaptive SOC Investigator investigates the alert and everything the organization already learned about alerts like it."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Traditional SOC",
              body: "Investigate the current alert.",
              tone: "border-border",
              icon: Layers,
            },
            {
              title: "AI Investigator",
              body: "Analyze the current evidence.",
              tone: "border-border",
              icon: Brain,
            },
            {
              title: "Adaptive SOC Investigator",
              body: "Recall what the organization already learned.",
              tone: "border-primary/40 glow-primary",
              icon: History,
            },
          ].map((card) => (
            <div key={card.title} className={`panel p-6 ${card.tone}`}>
              <card.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading eyebrow="Workflow" title="Alert → Recall → Investigate → Decide → Retain → Adapt" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="panel p-6">
                <p className="font-mono text-2xl font-semibold text-primary/70">{step.n}</p>
                <h3 className="mt-3 text-base font-semibold">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core differentiator */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mono-label">Core differentiator</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Previous investigations become reusable organizational knowledge
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              When an analyst confirms, rejects or modifies an assessment, the reasoning, evidence
              pattern and outcome are retained as an experience. The next comparable alert recalls
              those experiences before a hypothesis is formed — so the team stops re-deriving the
              same conclusions.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Evidence patterns are matched against retained experiences",
                "Similarity and previous analyst decisions are shown, never hidden",
                "Hypotheses evolve with an explicit, auditable reason",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <p className="mono-label">Hypothesis evolution</p>
            <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
              <p className="mono-label">Initial hypothesis</p>
              <p className="mt-1 text-sm">Possible Brute-Force Attack</p>
            </div>
            <div className="my-3 flex items-center gap-2 pl-4 text-ai">
              <GitBranch className="size-4" />
              <span className="text-xs">3 relevant experiences recalled from organizational memory</span>
            </div>
            <div className="rounded-lg border border-ai/40 bg-ai/10 p-4 glow-ai">
              <p className="mono-label">Evolved hypothesis</p>
              <p className="mt-1 text-sm font-medium">Potential Credential Compromise</p>
              <p className="mt-2 text-xs text-muted-foreground">
                AI-generated assessment · 91% confidence · not a confirmed security finding
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="border-y border-border/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Architecture"
            title="A clean separation between interface, reasoning and memory"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              { t: "Next-gen React frontend", d: "Investigation workspace, alert triage and analytics.", icon: Layers },
              { t: "FastAPI service layer", d: "Investigation orchestration behind a REST contract.", icon: GitBranch },
              { t: "Groq reasoning", d: "Hypothesis evolution from evidence plus recalled experience.", icon: Brain },
              { t: "Hindsight + database", d: "Long-term organizational memory and persistent records.", icon: Database },
            ].map((item) => (
              <div key={item.t} className="panel p-6">
                <item.icon className="size-5 text-primary" />
                <h3 className="mt-4 text-sm font-semibold">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Human in the loop */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="panel flex flex-col items-center gap-4 p-10 text-center">
          <Lock className="size-6 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight">AI recommends. The analyst decides.</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            No assessment is ever closed automatically. Every decision requires an analyst, a
            reason and an outcome — and every mutation is written to an immutable activity log.
          </p>
          <Link
            to="/signup"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start an Investigation <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
