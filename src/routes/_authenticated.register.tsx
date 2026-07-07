import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type SubmitEvent } from "react";
import { UserPlus, ShieldAlert, Users } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { assignableRoles, roleLabel } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RegisterRequest } from "@/types/requests/AuthRequest";
import { registerUser } from "@/services/userService";
import { UserResponse } from "@/types/responses/UserResponse";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useUsers";

export const Route = createFileRoute("/_authenticated/register")({
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(160),
  team: z.string().trim().max(60).optional(),
  role: z.enum(["employee", "team_leader", "project_manager"]),
});

type RegisterFormState = Omit<RegisterRequest, "role"> & { role: Role | "" };

function RegisterPage() {
  return (
    <RequireRole roles={["admin", "team_leader"]}>
      <RegisterPageContent />
    </RequireRole>
  );
}

function RegisterPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient()

  const allowedRoles = useMemo<{ value: Role; label: string }[]>(
    () => assignableRoles(user).map((value) => ({ value, label: roleLabel(value) })),
    [user]
  );

  const [team, setTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<RegisterFormState>({ name: "", email: "", password: "", role: "" })

  const { data: apiUsers = [] } = useUsers()

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!assignableRoles(user).includes(parsed.data.role)) {
      toast.error("Team leaders can only create employee accounts");
      return;
    }
    if (apiUsers.some((u) => u.email.toLowerCase() === parsed.data.email)) {
      toast.error("An account with that email already exists");
      return;
    }
    setSubmitting(true);
    try {
      const response = await registerUser({ ...form, role: parsed.data.role, password: "Bytmig123!" })
      if (!response) {
        toast.error(`Failed to register ${form.name}`)
        return
      }
      toast.success(`${form.name} registered successfully!`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm({ name: "", email: "", password: "", role: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setSubmitting(false);
    }
  };

  const recent = apiUsers.slice(-5).reverse();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Register new user</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "admin"
              ? "Create employee or team leader accounts."
              : "Create new employee accounts for your team."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" /> Account details
            </CardTitle>
            <CardDescription>The user will be able to sign in with the email below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Jane Andersson"
                  required
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jane@acme.co"
                  required
                  maxLength={160}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Input
                  id="team"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Platform"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm(prev => ({ ...prev, role: v as Role }))}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user?.role === "team_leader" && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Only an admin can create another team leader.
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Creating..." : "Create account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Recently added
            </CardTitle>
            <CardDescription>The five most recent accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map((u) => (
              <div
                key={u.userId ?? u.email}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {roleLabel(u.role)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              All users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {apiUsers.map((u: UserResponse, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {roleLabel(u.role)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
