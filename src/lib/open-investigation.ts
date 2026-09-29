import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the investigation id for an alert, creating the investigation
 * (and its initial hypothesis + audit trail) the first time it is opened.
 */
export async function openInvestigationForAlert(alertId: string) {
  const existing = await supabase
    .from("investigations")
    .select("id")
    .eq("alert_id", alertId)
    .maybeSingle();
  if (existing.data) return existing.data.id;

  const { data: alert, error: alertError } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .single();
  if (alertError) throw alertError;

  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = auth.user
    ? await supabase.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle()
    : { data: null };
  const actorName = profile?.full_name ?? auth.user?.email ?? "Analyst";

  const { data: investigation, error } = await supabase
    .from("investigations")
    .insert({
      alert_id: alert.id,
      ref: alert.ref,
      status: "open",
      category: alert.category,
      ai_state: "idle",
      assigned_to: auth.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("hypotheses").insert({
    investigation_id: investigation.id,
    stage: "initial",
    statement: alert.initial_hypothesis ?? "Initial triage hypothesis pending",
    confidence: null,
    reasoning: "Derived from the detection rule that raised this alert, before memory recall.",
    source: "detection",
  });

  await supabase.from("audit_logs").insert({
    actor_id: auth.user?.id ?? null,
    actor_name: actorName,
    action: "INVESTIGATION_CREATED",
    entity: investigation.ref,
    investigation_id: investigation.id,
    description: `Investigation opened for ${alert.ref}`,
  });

  return investigation.id;
}
