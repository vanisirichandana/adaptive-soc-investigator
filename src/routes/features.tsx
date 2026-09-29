import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  FileClock,
  History,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Adaptive SOC Investigator" },
      {
        name: "description",
        content:
          "Alert triage, evidence timelines, AI hypothesis evolution, organizational memory recall, analyst decisions, outcomes and full audit logging.",
      },
      { property: "og:title", content: "Features — Adaptive SOC Investigator" },
      {
        property: "og:description",
        content: "Everything in the adaptive investigation loop, from alert intake to retained experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});

const FEATURES = [
  {
    icon: Bell,
    title: "Alert triage console",
    body: "Severity, risk score, source, identity and status in one filterable table backed by live queries — not a static list.",
  },
  {
    icon: Activity,
    title: "Evidence timeline",
    body: "Each alert carries an ordered evidence chain: authentication failures, device novelty, process execution, network activity.",
  },
  {
    icon: Brain,
    title: "AI hypothesis evolution",
    body: "An initial hypothesis is challenged with current evidence and recalled experience, producing an evolved assessment with a stated confidence.",
  },
  {
    icon: History,
    title: "Organizational memory recall",
    body: "Relevant previous investigations are retrieved with a similarity score and the decision the analyst made last time.",
  },
  {
    icon: UserCheck,
    title: "Human decision gate",
    body: "Confirm, reject or modify. A reason is mandatory, and the original and final hypotheses are both stored.",
  },
  {
    icon: ShieldCheck,
    title: "Outcome capture",
    body: "Account isolated, credentials reset, endpoint quarantined, false positive or escalated — recorded against the investigation.",
  },
  {
    icon: FileClock,
    title: "Immutable activity log",
    body: "Every mutation writes an audit entry: analysis started, recall completed, hypothesis updated, experience retained.",
  },
  {
    icon: BarChart3,
    title: "Operational analytics",
    body: "Severity distribution, decision mix and retained experiences over time, all calculated from stored records.",
  },
];

function Features() {
  return (
    <SiteLayout>
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Platform"
            title="Built around the investigation, not the dashboard"
            description="Each capability exists to move one investigation from raw telemetry to retained organizational knowledge."
          />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="panel p-6">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <feature.icon className="size-4" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
