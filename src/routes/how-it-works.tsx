import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Adaptive SOC Investigator" },
      {
        name: "description",
        content:
          "Walk the adaptive loop: alert intake, memory recall, evidence analysis, hypothesis evolution, analyst decision, outcome and retained experience.",
      },
      { property: "og:title", content: "How it works — Adaptive SOC Investigator" },
      {
        property: "og:description",
        content: "From INC-1047 to retained organizational knowledge, step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  {
    n: "01",
    t: "Alert",
    d: "Correlated telemetry arrives as an alert with severity, risk score and an initial hypothesis. Example: INC-1047, 47 failed logins followed by a successful sign-in and PowerShell execution, initially read as a possible brute-force attack.",
  },
  {
    n: "02",
    t: "Recall",
    d: "Before any conclusion is drawn, the evidence pattern is matched against retained experiences. Three previous investigations surface with similarity scores and the decisions analysts made at the time.",
  },
  {
    n: "03",
    t: "Investigate",
    d: "Current evidence and recalled experience are analysed together. The reasoning is shown progressively so the analyst can follow how the assessment is formed.",
  },
  {
    n: "04",
    t: "Decide",
    d: "The analyst confirms, rejects or modifies the assessment. A reason is required in every path, and a modified hypothesis replaces the AI statement in the record.",
  },
  {
    n: "05",
    t: "Retain",
    d: "The decision, reasoning and outcome are written back as a new experience, optionally pushed to the external memory service, and the investigation is closed.",
  },
  {
    n: "06",
    t: "Adapt",
    d: "The next alert with a comparable pattern recalls this experience, so the investigation starts from what the organization learned rather than from zero.",
  },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="The adaptive loop"
            title="Six stages, one continuously improving investigation"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <ol className="relative space-y-4 border-l border-border pl-8">
          {STAGES.map((stage) => (
            <li key={stage.n} className="relative">
              <span className="absolute -left-[41px] grid size-6 place-items-center rounded-full border border-primary/40 bg-background font-mono text-[10px] text-primary">
                {stage.n}
              </span>
              <div className="panel p-6">
                <h3 className="text-base font-semibold">{stage.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="panel mt-10 p-8 text-center">
          <h3 className="text-xl font-semibold">Experience retained.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The next investigation starts with what we learned today.
          </p>
          <Link
            to="/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start an Investigation <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
