import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Status } from "@/Enum/Status";
import * as reportService from "@/services/reportService";

export const Route = createFileRoute("/_authenticated/pm-review")({
  component: PmReviewPage,
});

function PmReviewPage() {
  const { user } = useAuth();
  const canAccess = user?.role === "project_manager" || user?.role === "admin";
  if (!canAccess) return <Navigate to="/dashboard" />;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: reports = [] } = useReports();
  const { data: users = [] } = useUsers();

  const queryClient = useQueryClient();
  const { mutate: sendToPayroll } = useMutation({
    mutationFn: async (ids: string[]) => {
      const now = new Date().toISOString();
      await Promise.all(
        ids.map((id) =>
          reportService.updateReportStatus(id, { status: Status.sent, sentAt: now })
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const forwarded = useMemo(
    () =>
      reports
        .filter((r) => r.status === Status.forwarded)
        .sort((a, b) => (b.forwardedAt ?? "").localeCompare(a.forwardedAt ?? "")),
    [reports]
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
    if (selected.size === forwarded.length) setSelected(new Set());
    else setSelected(new Set(forwarded.map((r) => r.id ?? "")));
  };

  const totalSelectedHours = forwarded
    .filter((r) => selected.has(r.id ?? ""))
    .reduce((s, r) => s + totalHours(r.timeEntries), 0);

  const handleSend = () => {
    const ids = Array.from(selected);
    sendToPayroll(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} report${ids.length === 1 ? "" : "s"} sent for payroll`);
        setSelected(new Set());
        setConfirmOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review forwarded reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send approved reports to payroll. {forwarded.length} report{forwarded.length === 1 ? "" : "s"} awaiting.
          </p>
        </div>
        <Button disabled={selected.size === 0} onClick={() => setConfirmOpen(true)}>
          <Send className="mr-2 h-4 w-4" /> Send to payroll {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-6 py-3">
                  <Checkbox
                    checked={forwarded.length > 0 && selected.size === forwarded.length}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Week</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Forwarded</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forwarded.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No reports forwarded by team leaders yet.
                  </td>
                </tr>
              )}
              {forwarded.map((r) => {
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
                    <td className="px-6 py-3">{formatWeekRange(r.weekStart)}</td>
                    <td className="px-6 py-3 font-medium">{totalHours(r.timeEntries)}h</td>
                    <td className="px-6 py-3 text-muted-foreground">{r.forwardedAt ? formatDate(r.forwardedAt) : "—"}</td>
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
            <DialogTitle>Send {selected.size} report{selected.size === 1 ? "" : "s"} to payroll?</DialogTitle>
            <DialogDescription>
              {totalSelectedHours}h will be submitted for payroll processing. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" /> Confirm send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
