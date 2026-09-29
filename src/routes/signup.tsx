import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create analyst account — Adaptive SOC Investigator" },
      {
        name: "description",
        content:
          "Create an analyst account to triage alerts, run adaptive investigations and retain organizational memory.",
      },
      { property: "og:title", content: "Create analyst account — Adaptive SOC Investigator" },
      { property: "og:description", content: "Join the adaptive investigation command center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for the password");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, organization_name: organization },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Account created. Check your email to confirm, then sign in.");
      navigate({ to: "/login" });
      return;
    }
    await supabase.from("profiles").upsert({
      id: data.user!.id,
      full_name: fullName,
      organization_name: organization,
      role: "Security Analyst",
    });
    toast.success("Welcome to the command center");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary glow-primary">
            <ShieldCheck className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Adaptive SOC <span className="text-primary">Investigator</span>
          </span>
        </Link>

        <div className="panel p-8">
          <h1 className="text-xl font-semibold tracking-tight">Create your analyst account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your decisions become part of the organization's investigation memory.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organization</Label>
              <Input
                id="org"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Northwind Grid Industries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
