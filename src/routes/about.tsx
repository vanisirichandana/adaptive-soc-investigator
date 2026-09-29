import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { SiteLayout, SectionHeading } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Adaptive SOC Investigator" },
      {
        name: "description",
        content:
          "Why an investigation platform should remember: the thinking behind adaptive, memory-backed security operations and the data used in this demonstration.",
      },
      { property: "og:title", content: "About — Adaptive SOC Investigator" },
      {
        property: "og:description",
        content: "The case for organizational memory in security operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="About"
            title="Security teams keep solving the same problem twice"
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            A SOC investigates thousands of alerts. Each one is examined, reasoned about and
            resolved — and then the reasoning largely disappears into a ticket. The next analyst
            facing a near-identical pattern starts again from the raw evidence.
          </p>
          <p>
            Adaptive SOC Investigator treats each completed investigation as an asset. The evidence
            pattern, the analyst's decision, the reason behind it and the operational outcome are
            retained as an experience that future investigations can recall. Over time the platform
            stops being a viewer of alerts and becomes a record of how this organization reasons
            about threats.
          </p>
          <p>
            The analyst stays in control throughout. The system produces an assessment with a
            confidence level and its supporting reasoning, but nothing is closed without a human
            decision and a stated reason.
          </p>
        </div>

        <div className="panel mt-10 flex items-start gap-4 border-warning/40 p-6">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <h3 className="text-base font-semibold text-foreground">About the data in this build</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              All organizations, identities, hostnames and addresses shown are synthetic and were
              created for demonstration. Network addresses use documentation ranges. No commands
              shown in evidence are executed — they are recorded telemetry strings only.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
