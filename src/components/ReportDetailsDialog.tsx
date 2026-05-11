import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useData } from "@/lib/data-store";
import type { WeeklyReport } from "@/lib/types";
import { formatShortDate, formatWeekRange, totalHours } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

interface Props {
  report: WeeklyReport | null;
  onClose: () => void;
}

export function ReportDetailsDialog({ report, onClose }: Props) {
  const { getProjectById, getUserById } = useData();
  const open = !!report;
  const user = report ? getUserById(report.userId) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {report && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3">
                <span>{formatWeekRange(report.weekStart)}</span>
                <StatusBadge status={report.status} />
              </DialogTitle>
              <DialogDescription>
                {user?.name} · {totalHours(report.entries)}h total
              </DialogDescription>
            </DialogHeader>

            {report.feedback && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Feedback</p>
                <p className="mt-1 text-foreground/80">{report.feedback}</p>
              </div>
            )}

            <div className="-mx-6 max-h-96 overflow-y-auto border-y">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-2 font-medium">Date</th>
                    <th className="px-6 py-2 font-medium">Project</th>
                    <th className="px-6 py-2 font-medium">Hours</th>
                    <th className="px-6 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-6 py-2 whitespace-nowrap">{formatShortDate(e.date)}</td>
                      <td className="px-6 py-2">{getProjectById(e.projectId)?.name}</td>
                      <td className="px-6 py-2 font-medium">{e.hours}h</td>
                      <td className="px-6 py-2 text-muted-foreground">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
