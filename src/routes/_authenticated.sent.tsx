import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Forward } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatDate, formatWeekRange, totalHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReports } from "@/hooks/useReports";
import { useUsers } from "@/hooks/useUsers";
import { useProjects } from "@/hooks/useProjects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Status } from "@/Enum/Status";
import * as reportService from "@/services/reportService";
import { getLedProjectIds, isAdmin, isLeaderOf } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/sent")({
  component: SentPage,
});

function SentPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useProjects();
  if (isLoading) return null;
  const ledProjectIds = getLedProjectIds(projects, user?.id);
  const canAccess = isLeaderOf(user, ledProjectIds) || isAdmin(user);
  if (!canAccess) return <Navigate to="/dashboard" />;
  return <SentPageContent />;
}

function SentPageContent() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const ledProjectIds = getLedProjectIds(projects, user?.id);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: reports = [] } = useReports();
  const { data: users = [] } = useUsers();
  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const queryClient = useQueryClient();
  const { mutate: forwardReports } = useMutation({
    mutationFn: async (ids: string[]) => {
      const now = new Date().toISOString();
      await Promise.all(
        ids.map((id) =>
          reportService.updateReportStatus(id, { status: Status.forwarded, forwardedAt: now })
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const verified = useMemo(
    () =>
      reports
        .filter((r) => r.status === Status.verified)
        .filter((r) => isLeaderOf(user, ledProjectIds, r.projectId) || isAdmin(user))
        .sort((a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? "")),
    [reports, user, ledProjectIds]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === verified.length) setSelected(new Set());
    else setSelected(new Set(verified.map((r) => r.id ?? "")));
  };

  const totalSelectedHours = verified
    .filter((r) => selected.has(r.id ?? ""))
    .reduce((s, r) => s + totalHours(r.timeEntries), 0);

  const handleForward = () => {
    const ids = Array.from(selected);
    forwardReports(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} report${ids.length === 1 ? "" : "s"} forwarded to project manager`);
        setSelected(new Set());
        setConfirmOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forward verified reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Forward verified reports to the project manager for payroll approval.
          </p>
        </div>
        <Button disabled={selected.size === 0} onClick={() => setConfirmOpen(true)}>
          <Forward className="mr-2 h-4 w-4" /> Forward {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-6 py-3">
                  <Checkbox
                    checked={verified.length > 0 && selected.size === verified.length}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Week</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Verified</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {verified.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No verified reports waiting to be forwarded.
                  </td>
                </tr>
              )}
              {verified.map((r) => {
                const u = users.find((u) => u.userId === r.userId);
                const checked = selected.has(r.id ?? "");
                return (
                  <tr key={r.id} className={checked ? "bg-primary/5" : "hover:bg-muted/30"}>
                    <td className="px-6 py-3">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(r.id ?? "")} aria-label={`Select ${u?.name}`} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {(u?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium">{u?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{projectNameById.get(r.projectId ?? "") ?? "—"}</td>
                    <td className="px-6 py-3">{formatWeekRange(r.weekStart)}</td>
                    <td className="px-6 py-3 font-medium">{totalHours(r.timeEntries)}h</td>
                    <td className="px-6 py-3 text-muted-foreground">{r.verifiedAt ? formatDate(r.verifiedAt) : "—"}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status ?? Status.noStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward {selected.size} report{selected.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              {totalSelectedHours}h will be forwarded to the project manager for payroll approval.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleForward}>
              <Forward className="mr-2 h-4 w-4" /> Confirm forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
