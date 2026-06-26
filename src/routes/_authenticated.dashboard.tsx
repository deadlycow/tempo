import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Inbox,
  Send,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatWeekRange, totalHours } from "@/lib/format";
import { useReports } from "@/hooks/useReports";
import { Status } from "@/Enum/Status";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "team_leader" ? <LeaderDashboard /> : <EmployeeDashboard />;
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: reports = [] } = useReports();
  const { data: projects = [] } = useProjects();

  const counts = {
    submitted: reports.filter((r) => r.status === Status.submitted).length,
    verified: reports.filter((r) => r.status === Status.verified || r.status === Status.sent).length,
    rejected: reports.filter((r) => r.status === Status.rejected).length,
    draft: reports.filter((r) => r.status === Status.draft).length,
  };

  const recent = [...reports]
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user!.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here is an overview of your time reports.</p>
        </div>
        <Link to="/weekly-report">
          <Button>
            <FileEdit className="mr-2 h-4 w-4" /> New weekly report
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending verification" value={counts.submitted} icon={Clock} tone="info" />
        <StatCard label="Verified" value={counts.verified} icon={CheckCircle2} tone="success" />
        <StatCard label="Drafts" value={counts.draft} icon={FileText} tone="default" />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} tone="destructive" />
      </div>

      <div className="rounded-xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Recent reports</h2>
          <Link to="/history" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState message="You have no reports yet." />
        ) : (
          <ul className="divide-y">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{formatWeekRange(r.weekStart)}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {Array.from(new Set(r.timeEntries.map((e) => projects.find((p) => p.id === e.projectId)?.name).filter(Boolean))).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-muted-foreground sm:inline">{totalHours(r.timeEntries)}h</span>
                  <StatusBadge status={r.status ?? Status.noStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LeaderDashboard() {
  const { user } = useAuth();
  const { data: reports = [] } = useReports();
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();

  const employees = users.filter((u) => u.role === "employee");
  const teamReports = useMemo(
    () => reports.filter((r) => employees.some((e) => e.userId === r.userId)),
    [reports, employees]
  );

  const counts = {
    pending: teamReports.filter((r) => r.status === Status.submitted).length,
    verified: teamReports.filter((r) => r.status === Status.verified).length,
    sent: teamReports.filter((r) => r.status === Status.sent).length,
    employees: employees.length,
  };

  const totalTeamHours = teamReports.reduce((sum, r) => sum + totalHours(r.timeEntries), 0);

  const pendingList = teamReports
    .filter((r) => r.status === Status.submitted)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
    .slice(0, 6);

  const projectHours = new Map<string, number>();
  teamReports.forEach((r) => {
    r.timeEntries.forEach((e) => {
      projectHours.set(e.projectId, (projectHours.get(e.projectId) ?? 0) + e.hoursWorked);
    });
  });
  const topProjects = Array.from(projectHours.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxHours = Math.max(...topProjects.map(([, h]) => h), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor and verify reports from your team.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting review" value={counts.pending} icon={Inbox} tone="warning" />
        <StatCard label="Verified" value={counts.verified} icon={CheckCircle2} tone="success" />
        <StatCard label="Sent for payroll" value={counts.sent} icon={Send} tone="primary" />
        <StatCard label="Team members" value={counts.employees} icon={Users} hint={`${totalTeamHours}h total tracked`} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-base font-semibold">Pending verification</h2>
            <Link to="/pending" className="text-sm text-primary hover:underline">
              Open queue
            </Link>
          </div>
          {pendingList.length === 0 ? (
            <EmptyState message="No reports awaiting review." />
          ) : (
            <ul className="divide-y">
              {pendingList.map((r) => {
                const u = users.find((u) => u.userId === r.userId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(u?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatWeekRange(r.weekStart)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{totalHours(r.timeEntries)}h</span>
                      <StatusBadge status={r.status ?? Status.noStatus} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Top projects</h2>
          </div>
          <div className="mt-5 space-y-4">
            {topProjects.map(([pid, h]) => {
              const p = projects.find((p) => p.id === pid);
              return (
                <div key={pid}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{p?.name}</span>
                    <span className="text-muted-foreground">{h}h</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(h / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
