import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-store";
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

export const Route = createFileRoute("/_authenticated/pending")({
  component: PendingPage,
});

function PendingPage() {
  const { user } = useAuth();
  const { reports, users, getUserById, getProjectById, setReportStatus } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const employees = users.filter((u) => u.role === "employee" && u.team === user!.team);
  const pending = useMemo(
    () =>
      reports
        .filter((r) => r.status === "submitted" && employees.some((e) => e.id === r.userId))
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    [reports, employees]
  );

  if (user!.role !== "team_leader") {
    return <p className="text-sm text-muted-foreground">This page is only available to team leaders.</p>;
  }

  const handleVerify = (id: string) => {
    setReportStatus(id, "verified", { reviewedBy: user!.id });
    toast.success("Report verified");
  };

  const handleReject = () => {
    if (!rejectId) return;
    if (!feedback.trim()) return toast.error("Please provide feedback");
    setReportStatus(rejectId, "rejected", { feedback, reviewedBy: user!.id });
    toast.success("Report rejected with feedback");
    setRejectId(null);
    setFeedback("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pending verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted reports from your team. {pending.length} report{pending.length === 1 ? "" : "s"} awaiting.
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
          const u = getUserById(r.userId);
          const expanded = expandedId === r.id;
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border bg-card shadow-soft">
              <button
                onClick={() => setExpandedId(expanded ? null : r.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {u?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{u?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWeekRange(r.weekStart)} · submitted {r.submittedAt ? formatDate(r.submittedAt) : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{totalHours(r.entries)}h</span>
                  <StatusBadge status={r.status} />
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
                        {r.entries.map((e) => (
                          <tr key={e.id}>
                            <td className="whitespace-nowrap px-6 py-2">{formatShortDate(e.date)}</td>
                            <td className="px-6 py-2">{getProjectById(e.projectId)?.name}</td>
                            <td className="px-6 py-2 font-medium">{e.hours}h</td>
                            <td className="px-6 py-2 text-muted-foreground">{e.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-card px-6 py-3">
                    <Button variant="outline" onClick={() => setRejectId(r.id)}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleVerify(r.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Verify
                    </Button>
                  </div>
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
