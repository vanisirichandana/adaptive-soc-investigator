import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_GROUPS = [
  {
    label: "Command Center",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/alerts", label: "Alerts", icon: Siren },
      { to: "/investigations", label: "Investigations", icon: Search },
      { to: "/hindsight", label: "Hindsight", icon: History },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/activity", label: "Activity", icon: Activity },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (data) return { ...data, email: auth.user.email };
      const meta = auth.user.user_metadata ?? {};
      const inserted = await supabase
        .from("profiles")
        .upsert({
          id: auth.user.id,
          full_name: (meta["full_name"] as string) ?? auth.user.email?.split("@")[0] ?? "Analyst",
          organization_name: (meta["organization_name"] as string) ?? "Northwind Grid Industries",
        })
        .select()
        .maybeSingle();
      return inserted.data ? { ...inserted.data, email: auth.user.email } : null;
    },
  });
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: profile } = useProfile();

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary glow-primary">
          <ShieldCheck className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">ADAPTIVE SOC</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mono-label px-3">{group.label}</p>
            <div className="mt-2 space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  activeProps={{
                    className:
                      "bg-sidebar-accent text-foreground border-l-2 border-primary rounded-l-none",
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-sm font-medium">{profile?.full_name ?? "Analyst"}</p>
        <p className="mono-label mt-1">{profile?.role ?? "Security Analyst"}</p>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: profile } = useProfile();

  const { data: openAlerts } = useQuery({
    queryKey: ["open-alert-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "triaged", "investigating"]);
      return count ?? 0;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            aria-label="Close navigation"
            className="flex-1 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>

          <form
            className="relative hidden max-w-sm flex-1 md:block"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ to: "/alerts", search: { q: query } });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search alerts, identities, devices"
              className="pl-9"
            />
          </form>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success sm:flex">
              <span className="size-1.5 rounded-full bg-success animate-soc-pulse" />
              SOC ONLINE
            </span>
            <Link
              to="/alerts"
              search={{ q: "" }}
              className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Open alerts"
            >
              <Bell className="size-4" />
              {openAlerts ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-medium text-foreground">
                  {openAlerts}
                </span>
              ) : null}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid size-8 place-items-center rounded-full border border-border bg-surface text-xs font-medium">
                  {(profile?.full_name ?? "A").slice(0, 1).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              {actions}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
