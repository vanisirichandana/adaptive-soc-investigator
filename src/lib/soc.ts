export type Severity = "critical" | "high" | "medium" | "low";

export interface AlertRow {
  id: string;
  ref: string;
  title: string;
  description: string | null;
  severity: string;
  risk_score: number;
  status: string;
  source: string | null;
  actor_user: string | null;
  source_ip: string | null;
  destination: string | null;
  device: string | null;
  category: string | null;
  initial_hypothesis: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EvidenceRow {
  id: string;
  alert_id: string;
  occurred_at: string;
  label: string;
  detail: string | null;
  event_type: string | null;
  severity: string | null;
  sequence: number;
}

export interface InvestigationRow {
  id: string;
  alert_id: string;
  ref: string;
  status: string;
  category: string | null;
  ai_state: string;
  confidence: number | null;
  opened_at: string;
  completed_at: string | null;
  hindsight_experience_id: string | null;
}

export interface HypothesisRow {
  id: string;
  investigation_id: string;
  stage: string;
  statement: string;
  confidence: number | null;
  reasoning: string | null;
  source: string;
  created_at: string;
}

export interface ExperienceRow {
  id: string;
  ref: string;
  investigation_type: string;
  summary: string;
  evidence_pattern: string[];
  analyst_decision: string | null;
  outcome: string | null;
  created_at: string;
}

export interface RecallRow {
  id: string;
  investigation_id: string;
  experience_id: string;
  similarity: number;
  rationale: string | null;
  created_at: string;
  hindsight_experiences?: ExperienceRow | null;
}

export const severityStyles: Record<string, string> = {
  critical: "border-critical/40 bg-critical/12 text-critical",
  high: "border-warning/40 bg-warning/12 text-warning",
  medium: "border-primary/40 bg-primary/12 text-primary",
  low: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
};

export const statusStyles: Record<string, string> = {
  open: "border-primary/40 bg-primary/10 text-primary",
  triaged: "border-warning/40 bg-warning/10 text-warning",
  investigating: "border-ai/40 bg-ai/10 text-ai",
  completed: "border-success/40 bg-success/10 text-success",
  closed: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
};

export function riskTone(score: number) {
  if (score >= 85) return "text-critical";
  if (score >= 70) return "text-warning";
  if (score >= 50) return "text-primary";
  return "text-muted-foreground";
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export const OUTCOME_OPTIONS = [
  "Account isolated",
  "Credentials reset",
  "Endpoint quarantined",
  "False positive",
  "Escalated to incident response",
];
