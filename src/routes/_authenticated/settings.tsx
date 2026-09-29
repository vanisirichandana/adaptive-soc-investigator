import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useProfile } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Adaptive SOC Investigator" },
      { name: "description", content: "Analyst profile, integration status and session controls." },
      { property: "og:title", content: "Settings — Adaptive SOC Investigator" },
      { property: "og:description", content: "Manage your analyst profile and review integration status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setOrganization(profile.organization_name ?? "");
  }, [profile]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, organization_name: organization })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/login" });
  }

  return (
    <AppShell title="Settings" subtitle="Your analyst profile and platform integrations.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="mono-label">Analyst profile</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profile?.role ?? "Security Analyst"} readOnly disabled />
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save profile
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="mono-label">Integrations</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The reasoning service and Hindsight memory service are configured through server
              environment variables. When they are unavailable the platform falls back to a
              deterministic local engine so investigations still work end to end.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Reasoning service", "FASTAPI_URL / GROQ_API_KEY"],
                ["Hindsight memory", "HINDSIGHT_API_URL / HINDSIGHT_API_KEY"],
                ["Database & auth", "Managed by Lovable Cloud"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <p className="mono-label">Session</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of this device. Your investigations and decisions stay stored.
            </p>
            <Button variant="outline" className="mt-4" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
