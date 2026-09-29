import type { ReactNode } from "react";
import { severityStyles, statusStyles } from "@/lib/soc";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "primary" | "critical" | "ai" | "success";
  loading?: boolean;
}) {
  const toneClass = {
    primary: "text-primary",
    critical: "text-critical",
    ai: "text-ai",
    success: "text-success",
  }[tone];

  return (
    <div className="panel p-5">
      <p className="mono-label">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      )}
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
        severityStyles[severity] ?? severityStyles["low"]
      }`}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
        statusStyles[status] ?? statusStyles["open"]
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-2 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="panel space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
