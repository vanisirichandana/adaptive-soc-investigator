import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  History,
  Loader2,
  Sparkles,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { PanelSkeleton, SeverityBadge, StatusBadge } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTCOME_OPTIONS, formatTime, riskTone } from "@/lib/soc";
import { runAiInvestigation, retainExperience } from "@/lib/investigation.functions";

export const Route = createFileRoute("/_authenticated/investigations/$id")({
  head: () => ({
    meta: [
      { title: "Investigation workspace — Adaptive SOC Investigator" },
      { name: "description", content: "Evidence timeline, AI hypothesis evolution, recalled experience and the analyst decision." },
      { property: "og:title", content: "Investigation workspace — Adaptive SOC Investigator" },
      { property: "og:description", content: "AI recommends. The analyst decides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

const STAGES = [
  "Analyzing current evidence…",
  "Consulting organizational memory…",
  "Correlating previous investigation experiences…",
];

function Workspace() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const runAi = useServerFn(runAiInvestigation);
  const retain = useServerFn(retainExperience);

  const [stageIndex, setStageIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [decisionMode, setDecisionMode] = useState<"confirmed" | "rejected" | "modified" | null>(null);
  const [reason, setReason] = useState("");
  const [revised, setRevised] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [retaining, setRetaining] = useState(false);
  const [openExperience, setOpenExperience] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["investigation", id],
    queryFn: async () => {
      const investigation = await supabase
        .from("investigations")
        .select("*, alerts(*)")
        .eq("id", id)
        .single();
      if (investigation.error) throw investigation.error;
      const alertId = investigation.data.alert_id;
      const [evidence, hypotheses, recalls, decision, outcomeRow] = await Promise.all([
        supabase.from("evidence_events").select("*").eq("alert_id", alertId).order("sequence"),
        supabase.from("hypotheses").select("*").eq("investigation_id", id).order("created_at"),
        supabase
          .from("hindsight_recalls")
          .select("*, hindsight_experiences(*)")
          .eq("investigation_id", id)
          .order("similarity", { ascending: false }),
        supabase
          .from("analyst_decisions")
          .select("*")
          .eq("investigation_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("investigation_outcomes")
          .select("*")
          .eq("investigation_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        investigation: investigation.data,
        alert: investigation.data.alerts as Record<string, unknown> & {
          ref: string;
          title: string;
          severity: string;
          risk_score: number;
          actor_user: string | null;
          source_ip: string | null;
          device: string | null;
          metadata: Record<string, unknown> | null;
          initial_hypothesis: string | null;
        },
        evidence: evidence.data ?? [],
        hypotheses: hypotheses.data ?? [],
        recalls: recalls.data ?? [],
        decision: decision.data,
        outcome: outcomeRow.data,
      };
    },
  });

  useEffect(() => {
    if (!running) return;
    const timers = STAGES.map((_, index) =>
      setTimeout(() => setStageIndex(index), index * 900),
    );
    return () => timers.forEach(clearTimeout);
  }, [running]);

  const initial = data?.hypotheses.find((h) => h.stage === "initial");
  const evolved = [...(data?.hypotheses ?? [])].reverse().find((h) => h.stage !== "initial");
  const meta = (data?.alert.metadata ?? {}) as Record<string, unknown>;

  async function handleRunAi() {
    setRunning(true);
    setStageIndex(0);
    try {
      const result = await runAi({ data: { investigationId: id } });
      await new Promise((resolve) => setTimeout(resolve, 900));
      await queryClient.invalidateQueries();
      toast.success(
        `Hypothesis updated · ${result.recallCount} relevant experience${result.recallCount === 1 ? "" : "s"} recalled`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI investigation failed");
    } finally {
      setRunning(false);
      setStageIndex(-1);
    }
  }

  async function saveDecision() {
    if (!decisionMode || !data) return;
    if (!reason.trim()) {
      toast.error("A reason is required before recording a decision.");
      return;
    }
    if (decisionMode === "modified" && !revised.trim()) {
      toast.error("Provide the revised hypothesis.");
      return;
    }
    setSavingDecision(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth.user!.id)
      .maybeSingle();
    const originalStatement = initial?.statement ?? data.alert.initial_hypothesis ?? "";
    const aiStatement = evolved?.statement ?? originalStatement;
    const finalStatement =
      decisionMode === "modified" ? revised.trim() : decisionMode === "rejected" ? originalStatement : aiStatement;

    const { error } = await supabase.from("analyst_decisions").insert({
      investigation_id: id,
      analyst_id: auth.user!.id,
      decision: decisionMode,
      reason: reason.trim(),
      original_hypothesis: originalStatement,
      final_hypothesis: finalStatement,
    });
    if (error) {
      setSavingDecision(false);
      toast.error(error.message);
      return;
    }
    if (decisionMode === "modified") {
      await supabase.from("hypotheses").insert({
        investigation_id: id,
        stage: "analyst",
        statement: finalStatement,
        reasoning: reason.trim(),
        source: "analyst",
      });
    }
    await supabase.from("audit_logs").insert({
      actor_id: auth.user!.id,
      actor_name: profile?.full_name ?? auth.user!.email ?? "Analyst",
      action: `ANALYST_${decisionMode.toUpperCase().replace("ED", "ED")}`,
      entity: data.investigation.ref,
      investigation_id: id,
      description: `Analyst ${decisionMode} the AI assessment: ${reason.trim()}`,
    });
    setSavingDecision(false);
    setDecisionMode(null);
    setReason("");
    setRevised("");
    await queryClient.invalidateQueries();
    toast.success("Analyst decision recorded");
  }

  async function saveOutcome() {
    if (!outcome.trim() || !data) {
      toast.error("Select or enter an outcome first.");
      return;
    }
    setSavingOutcome(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth.user!.id)
      .maybeSingle();
    const { error } = await supabase.from("investigation_outcomes").insert({
      investigation_id: id,
      analyst_id: auth.user!.id,
      outcome: outcome.trim(),
      notes: outcomeNotes.trim() || null,
    });
    if (error) {
      setSavingOutcome(false);
      toast.error(error.message);
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_id: auth.user!.id,
      actor_name: profile?.full_name ?? auth.user!.email ?? "Analyst",
      action: "OUTCOME_RECORDED",
      entity: data.investigation.ref,
      investigation_id: id,
      description: `Outcome recorded: ${outcome.trim()}`,
    });
    setSavingOutcome(false);
    setOutcomeNotes("");
    await queryClient.invalidateQueries();
    toast.success("Outcome recorded");
  }

  async function handleRetain() {
    setRetaining(true);
    try {
      await retain({ data: { investigationId: id } });
      await queryClient.invalidateQueries();
      toast.success("Experience retained in organizational memory");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retain the experience");
    } finally {
      setRetaining(false);
    }
  }

  if (isLoading || !data) {
    return (
      <AppShell title="Investigation" subtitle="Loading workspace…">
        <PanelSkeleton rows={8} />
      </AppShell>
    );
  }

  const { alert, investigation } = data;
  const retained = Boolean(investigation.hindsight_experience_id);
  const evidenceFacts: Array<[string, string]> = [
    ["User", alert.actor_user ?? "—"],
    ["Source IP", alert.source_ip ?? "—"],
    ["Device", alert.device ?? "—"],
    ["MFA", String(meta["mfa"] ?? "—")],
    ["Process", String(meta["process"] ?? "—")],
    ["Failed logins", String(meta["failed_logins"] ?? "—")],
    ["Successful login", String(meta["successful_login"] ?? "—")],
    ["New device", String(meta["new_device"] ?? "—")],
    ["PowerShell activity", String(meta["powershell_activity"] ?? "—")],
  ];

  return (
    <AppShell
      title={alert.title}
      subtitle={`${alert.ref} · ${investigation.ref}`}
      actions={
        <div className="flex items-center gap-3">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={investigation.status} />
          <span className={`font-mono text-sm ${riskTone(alert.risk_score)}`}>
            Risk {alert.risk_score}/100
          </span>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-5">
          <p className="mono-label">Evidence timeline</p>
          <ol className="mt-4 space-y-4">
            {data.evidence.map((event, index) => (
              <li
                key={event.id}
                className="animate-soc-rise relative pl-6"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                {index < data.evidence.length - 1 ? (
                  <span className="absolute left-[3px] top-4 h-full w-px bg-border" />
                ) : null}
                <p className="font-mono text-xs text-muted-foreground">
                  {formatTime(event.occurred_at)}
                </p>
                <p className="mt-0.5 text-sm font-medium uppercase tracking-wide">{event.label}</p>
                {event.detail ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                ) : null}
              </li>
            ))}
            {data.evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence events recorded.</p>
            ) : null}
          </ol>
        </div>

        <div className="panel p-5">
          <p className="mono-label">Current evidence</p>
          <dl className="mt-4 space-y-2.5">
            {evidenceFacts.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel border-ai/30 p-5">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-ai" />
            <p className="mono-label text-ai">AI Investigator</p>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
            <p className="mono-label">Initial hypothesis</p>
            <p className="mt-1 text-sm">{initial?.statement ?? "—"}</p>
          </div>

          {running ? (
            <div className="mt-4 space-y-2">
              {STAGES.map((stage, index) => (
                <div
                  key={stage}
                  className={`flex items-center gap-2 text-sm transition-opacity ${
                    index <= stageIndex ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {index < stageIndex ? (
                    <CheckCircle2 className="size-3.5 text-success" />
                  ) : (
                    <Loader2 className="size-3.5 animate-spin text-ai" />
                  )}
                  {stage}
                </div>
              ))}
            </div>
          ) : null}

          {evolved && !running ? (
            <div className="animate-soc-rise mt-4 rounded-lg border border-ai/40 bg-ai/8 p-3 glow-ai">
              <div className="flex items-center justify-between gap-2">
                <p className="mono-label text-ai">Evolved hypothesis</p>
                <span className="font-mono text-xs text-ai">{evolved.confidence}% confidence</span>
              </div>
              <p className="mt-1.5 text-sm font-medium">{evolved.statement}</p>
              <p className="mt-2 text-xs text-muted-foreground">{evolved.reasoning}</p>
            </div>
          ) : null}

          <Button className="mt-4 w-full" onClick={handleRunAi} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {evolved ? "Re-run AI investigation" : "Run AI Investigation"}
          </Button>

          <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-warning" />
            AI-generated assessment. Not a confirmed finding — the analyst decides.
          </p>
        </div>
      </div>

      <div className="mt-4 panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-ai" />
            <p className="mono-label text-ai">Hindsight memory</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.recalls.length} relevant experience{data.recalls.length === 1 ? "" : "s"} found
          </span>
        </div>
        {data.recalls.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {data.recalls.map((recall) => {
              const experience = recall.hindsight_experiences as {
                id: string;
                ref: string;
                investigation_type: string;
                summary: string;
                analyst_decision: string | null;
                outcome: string | null;
                evidence_pattern: string[] | null;
              } | null;
              if (!experience) return null;
              return (
                <button
                  key={recall.id}
                  onClick={() => setOpenExperience(experience.id)}
                  className="rounded-xl border border-ai/25 bg-ai/8 p-4 text-left transition-colors hover:border-ai/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ai">{experience.ref}</span>
                    <span className="font-mono text-xs">{Number(recall.similarity)}% match</span>
                  </div>
                  <p className="mt-2 text-sm">{experience.summary}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {experience.analyst_decision} · {experience.outcome}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No experiences recalled yet. Run the AI investigation to consult organizational memory.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="mono-label">Analyst decision</p>
          <p className="mt-1 text-sm text-muted-foreground">
            AI recommends. The analyst decides — every decision needs a reason.
          </p>

          {data.decision ? (
            <div className="mt-4 rounded-lg border border-success/30 bg-success/8 p-4">
              <p className="text-sm font-medium uppercase tracking-wide text-success">
                {data.decision.decision}
              </p>
              <p className="mt-1.5 text-sm">{data.decision.final_hypothesis}</p>
              <p className="mt-2 text-xs text-muted-foreground">{data.decision.reason}</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setDecisionMode("confirmed")}>Confirm</Button>
              <Button variant="outline" onClick={() => setDecisionMode("rejected")}>
                Reject
              </Button>
              <Button variant="outline" onClick={() => setDecisionMode("modified")}>
                Modify
              </Button>
            </div>
          )}
        </div>

        <div className="panel p-5">
          <p className="mono-label">Outcome</p>
          {data.outcome ? (
            <div className="mt-4 rounded-lg border border-border bg-background/50 p-4">
              <p className="text-sm font-medium">{data.outcome.outcome}</p>
              {data.outcome.notes ? (
                <p className="mt-1 text-xs text-muted-foreground">{data.outcome.notes}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="Optional notes (containment steps, ticket reference)"
              />
              <Button onClick={saveOutcome} disabled={savingOutcome} className="w-full">
                {savingOutcome ? <Loader2 className="size-4 animate-spin" /> : null}
                Record outcome
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 panel p-5">
        {retained ? (
          <div className="animate-soc-rise space-y-1.5">
            <p className="text-sm text-success">✓ Investigation completed</p>
            <p className="text-sm text-success">✓ Analyst decision retained</p>
            <p className="text-sm text-success">✓ Experience added to organizational memory</p>
            <p className="pt-2 text-sm text-muted-foreground">
              Future investigations can now recall this experience.
            </p>
            <p className="pt-3 text-sm font-medium">
              Experience retained. The next investigation starts with what we learned today.
            </p>
            <Link to="/hindsight" className="inline-block pt-2 text-xs text-primary hover:underline">
              View it in organizational memory →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Save investigation experience</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Requires a recorded analyst decision and an outcome.
              </p>
            </div>
            <Button
              onClick={handleRetain}
              disabled={retaining || !data.decision || !data.outcome}
            >
              {retaining ? <Loader2 className="size-4 animate-spin" /> : <Terminal className="size-4" />}
              Save Investigation Experience
            </Button>
          </div>
        )}
      </div>

      <Dialog open={decisionMode !== null} onOpenChange={(open) => !open && setDecisionMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{decisionMode} the AI assessment</DialogTitle>
            <DialogDescription>
              Your reason is stored with the investigation and becomes part of organizational memory.
            </DialogDescription>
          </DialogHeader>
          {decisionMode === "modified" ? (
            <div className="space-y-2">
              <Input
                value={revised}
                onChange={(e) => setRevised(e.target.value)}
                placeholder="Revised hypothesis"
              />
            </div>
          ) : null}
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why did you reach this decision?"
            rows={4}
          />
          <Button onClick={saveDecision} disabled={savingDecision}>
            {savingDecision ? <Loader2 className="size-4 animate-spin" /> : null}
            Record decision
          </Button>
        </DialogContent>
      </Dialog>

      <ExperienceDialog id={openExperience} onClose={() => setOpenExperience(null)} />
    </AppShell>
  );
}

export function ExperienceDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["experience", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hindsight_experiences")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data?.ref ?? "Experience"}</DialogTitle>
          <DialogDescription>{data?.investigation_type}</DialogDescription>
        </DialogHeader>
        {data ? (
          <div className="space-y-4 text-sm">
            <p>{data.summary}</p>
            <div>
              <p className="mono-label">Evidence pattern</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(data.evidence_pattern ?? []).map((token: string) => (
                  <span
                    key={token}
                    className="rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {token}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mono-label">Analyst decision</p>
                <p className="mt-1">{data.analyst_decision}</p>
              </div>
              <div>
                <p className="mono-label">Outcome</p>
                <p className="mt-1">{data.outcome}</p>
              </div>
            </div>
          </div>
        ) : (
          <PanelSkeleton rows={3} />
        )}
      </DialogContent>
    </Dialog>
  );
}
