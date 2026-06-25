import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { Clock3, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoginRequest } from "@/types/requests/AuthRequest";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<LoginRequest>({ email: "", password: "" })
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return <div>Loading... </div>
  }
  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      login(user);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-sidebar-primary-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Clock3 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TimeTrack</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-sidebar-primary-foreground">
            Time reporting,<br />without the friction.
          </h2>
          <p className="max-w-md text-sidebar-foreground/70">
            Submit weekly hours, track verification status, and let team leaders approve and forward reports — all in one workspace.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { v: "12k+", l: "Hours tracked" },
              { v: "98%", l: "On-time submission" },
              { v: "5min", l: "Avg report time" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
                <p className="text-2xl font-semibold text-sidebar-primary-foreground">{s.v}</p>
                <p className="text-xs text-sidebar-foreground/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} TimeTrack. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground">Enter your work email to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => {
                  setUser(prev => ({ ...prev, email: e.target.value }))
                }}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={user.password}
                onChange={(e) => {
                  setUser(prev => ({ ...prev, password: e.target.value }))
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
