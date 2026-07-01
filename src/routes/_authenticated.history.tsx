import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatDate, formatWeekRange, totalHours } from "@/lib/format";
import type { ReportStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportDetailsDialog } from "@/components/ReportDetailsDialog";
import { Status } from "@/Enum/Status";
import { useReports } from "@/hooks/useReports";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as reportService from "@/services/reportService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>("");

  const { data: users = [] } = useUsers();
  const isLeader = user!.role === "team_leader" || (user!.role === "employee" && !!user!.isProjectLeader);
  const isAdmin = user!.role === "admin";
  const showEmployee = isLeader || isAdmin || user!.role === "project_manager";
  const employees = users.filter((u) => u.role === "employee");

  const { data: projects } = useProjects();
  const { data: reports } = useReports();

  const queryClient = useQueryClient();
  const { mutate: doOverride } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reportService.updateReportStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report status updated");
      setOverrideId(null);
      setOverrideStatus("");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const list = useMemo(() => {
    let l = reports ?? [];
    if (statusFilter !== "all") l = l.filter((r) => r.status === statusFilter);
    if (projectFilter !== "all") l = l.filter((r) => r.timeEntries.some((e) => e.projectId === projectFilter));
    if (showEmployee && userFilter !== "all") l = l.filter((r) => r.userId === userFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter((r) => r.timeEntries.some((e) => e.description?.toLowerCase().includes(q)));
    }
    return [...l].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [reports, showEmployee, statusFilter, projectFilter, userFilter, search]);

  const openReport = list?.find((r) => r.id === openId) ?? null;

  const projectNameById = useMemo(
    () => new Map(projects?.map((project) => [project.id, project.name])),
    [projects]
  );

  const allStatuses: ReportStatus[] = ["draft", "submitted", "verified", "rejected", "forwarded" as ReportStatus, "sent"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLeader ? "Team report history" : isAdmin || user!.role === "project_manager" ? "All reports" : "My reports"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLeader || isAdmin || user!.role === "project_manager"
            ? "Browse all time reports across the team."
            : "Read-only view of your past time reports."}
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-soft">
        <div className="grid gap-3 border-b p-4 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search descriptions..."
              className="pl-9"
            />
          </div>
          <div className="md:col-span-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showEmployee && (
            <div className="md:col-span-3">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.userId} value={e.userId ?? ""}>{e.name ?? e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {showEmployee && <th className="px-6 py-3 font-medium">Employee</th>}
                <th className="px-6 py-3 font-medium">Week</th>
                <th className="px-6 py-3 font-medium">Projects</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Updated</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list?.length === 0 && (
                <tr>
                  <td colSpan={showEmployee ? 7 : 6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No reports match your filters.
                  </td>
                </tr>
              )}
              {list?.map((r) => {
                const u = users.find((u) => u.userId === r.userId);
                const projectNames = [
                  ...new Set(
                    r.timeEntries
                      .map((entry) => projectNameById.get(entry.projectId))
                      .filter((name): name is string => name !== undefined)
                  ),
                ];
                const updated = r.sentAt ?? r.forwardedAt ?? r.verifiedAt ?? r.rejectedAt ?? r.submittedAt;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    {showEmployee && (
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {u?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium">{u?.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-3">{formatWeekRange(r.weekStart)}</td>
                    <td className="max-w-xs truncate px-6 py-3 text-muted-foreground">{projectNames.join(", ")}</td>
                    <td className="px-6 py-3 font-medium">{totalHours(r.timeEntries)}h</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={r.status ?? Status.noStatus} />
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{updated ? formatDate(updated) : "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setOpenId(r.id ?? null)}>
                          <Eye className="mr-1.5 h-4 w-4" /> View
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setOverrideId(r.id ?? null); setOverrideStatus(r.status ?? ""); }}
                          >
                            <ShieldAlert className="mr-1.5 h-4 w-4" /> Override
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ReportDetailsDialog report={openReport} projects={projects} onClose={() => setOpenId(null)} />

      <Dialog open={!!overrideId} onOpenChange={(o) => !o && setOverrideId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" /> Admin status override
            </DialogTitle>
            <DialogDescription>
              Manually set the report status. Use this to correct mistakes.
            </DialogDescription>
          </DialogHeader>
          <Select value={overrideStatus} onValueChange={setOverrideStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!overrideStatus}
              onClick={() => overrideId && doOverride({ id: overrideId, status: overrideStatus })}
            >
              Apply override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
