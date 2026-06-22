import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useData } from "@/lib/data-store";
import { formatShortDate, formatWeekRange, totalHours } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { Status } from "@/Enum/Status";
import { Report } from "@/types/reports";
import { ProjectResponse } from "@/types/responses/ProjectResponse";

interface Props {
  report: Report | null;
  projects: ProjectResponse[] | undefined
  onClose: () => void;
}

export function ReportDetailsDialog({ report, projects, onClose }: Props) {
  const { getUserById } = useData();
  // getProjectById
  const open = !!report;
  const user = report ? getUserById(report.userId) : null;

  const getProjectById = (id: string) => {
    return projects?.find((project) => project.id === id)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {report && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3">
                <span>{formatWeekRange(report.weekStart)}</span>
                <StatusBadge status={report.status ? report.status : Status.noStatus} />
              </DialogTitle>
              <DialogDescription>
                {user?.name} · {totalHours(report.timeEntries)}h total
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
                  {report.timeEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-6 py-2 whitespace-nowrap">{formatShortDate(e.date)}</td>
                      <td className="px-6 py-2">{getProjectById(e.projectId)?.name}</td>
                      <td className="px-6 py-2 font-medium">{e.hoursWorked}h</td>
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
