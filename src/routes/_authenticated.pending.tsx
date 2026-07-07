import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getLedProjectIds, isAdmin, isLeaderOf } from "@/lib/permissions";
import { CheckCircle2, ChevronDown, Forward, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatDate, formatShortDate, formatWeekRange, totalHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useReports } from "@/hooks/useReports";
import { useUsers } from "@/hooks/useUsers";
import { useProjects } from "@/hooks/useProjects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Status } from "@/Enum/Status";
import * as reportService from "@/services/reportService";

export const Route = createFileRoute("/_authenticated/pending")({
  component: PendingPage,
});

function PendingPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useProjects();
  if (isLoading) return null;
  const ledProjectIds = getLedProjectIds(projects, user?.id);
  const canAccess = isLeaderOf(user, ledProjectIds) || isAdmin(user);
  if (!canAccess) return <Navigate to="/dashboard" />;
  return <PendingPageContent />;
}

function PendingPageContent() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const { data: reports = [] } = useReports();
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const ledProjectIds = getLedProjectIds(projects, user?.id);

  const queryClient = useQueryClient();
  const { mutate: changeStatus } = useMutation({
    mutationFn: (args: Parameters<typeof reportService.updateReportStatus>) =>
      reportService.updateReportStatus(...args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const pending = useMemo(
    () =>
      reports
        .filter((r) => r.status === Status.submitted)
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    [reports]
  );

  const handleVerify = (id: string) => {
    const now = new Date().toISOString();
    changeStatus([id, { status: Status.verified, verifiedAt: now }], {
      onSuccess: () => toast.success("Report verified"),
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    if (!feedback.trim()) return toast.error("Please provide feedback");
    const now = new Date().toISOString();
    changeStatus([rejectId, { status: Status.rejected, rejectedAt: now, feedback }], {
      onSuccess: () => {
        toast.success("Report rejected with feedback");
        setRejectId(null);
        setFeedback("");
      },
    });
  };

  const handleForward = (id: string) => {
    const now = new Date().toISOString();
    changeStatus([id, { status: Status.forwarded, forwardedAt: now }], {
      onSuccess: () => toast.success("Report forwarded to project manager"),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pending verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted reports. {pending.length} report{pending.length === 1 ? "" : "s"} awaiting.
        </p>
      </div>

      <div className="space-y-3">
        {pending.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center shadow-soft">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="mt-3 text-sm font-medium">All caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">No reports waiting for verification.</p>
          </div>
        )}
        {pending.map((r) => {
          const u = users.find((u) => u.userId === r.userId);
          const expanded = expandedId === r.id;
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border bg-card shadow-soft">
              <button
                onClick={() => setExpandedId(expanded ? null : (r.id ?? null))}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(u?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{u?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {projectNameById.get(r.projectId ?? "") ?? "Unknown project"} · {formatWeekRange(r.weekStart)} · submitted {r.submittedAt ? formatDate(r.submittedAt) : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{totalHours(r.timeEntries)}h</span>
                  <StatusBadge status={r.status ?? Status.noStatus} />
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </div>
              </button>

              {expanded && (
                <div className="border-t bg-muted/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-6 py-2 font-medium">Date</th>
                          <th className="px-6 py-2 font-medium">Project</th>
                          <th className="px-6 py-2 font-medium">Hours</th>
                          <th className="px-6 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {r.timeEntries.map((e) => (
                          <tr key={e.id}>
                            <td className="whitespace-nowrap px-6 py-2">{formatShortDate(e.date)}</td>
                            <td className="px-6 py-2">{projects.find((p) => p.id === e.projectId)?.name}</td>
                            <td className="px-6 py-2 font-medium">{e.hoursWorked}h</td>
                            <td className="px-6 py-2 text-muted-foreground">{e.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(isLeaderOf(user, ledProjectIds, r.projectId) || isAdmin(user)) && (
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-card px-6 py-3">
                      <Button variant="outline" onClick={() => setRejectId(r.id ?? null)}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button variant="outline" onClick={() => handleVerify(r.id ?? "")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Verify
                      </Button>
                      <Button onClick={() => handleForward(r.id ?? "")}>
                        <Forward className="mr-2 h-4 w-4" /> Forward to PM
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject report</DialogTitle>
            <DialogDescription>
              Provide feedback so the employee can correct and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What needs to be changed?"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
