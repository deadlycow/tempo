import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, Send, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-store";
import { addDays, getWeekStart, isoDate } from "@/lib/mock-data";
import { dayLabel, formatShortDate, formatWeekRange, totalHours } from "@/lib/format";
import type { TimeEntry, WeeklyReport } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";

import * as timeEntry from "@/services/timeEntryService"
import { useQuery } from "@tanstack/react-query";
import { getReport } from "@/services/reportService";
import { getAllProjects } from "@/services/projectService";
import * as timeEntryService from"@/services/timeEntryService"
import { TimeEntryRequest } from "@/types/requests/TimeEntryRequest";
// import type { TimeEntryRequest } from "@/types/requests/TimeEntryRequest";

export const Route = createFileRoute("/_authenticated/weekly-report")({
  component: WeeklyReportPage,
});

function WeeklyReportPage() {
  const { user } = useAuth();
  const { reports, upsertReport } = useData();
// projects,
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState<string>(getWeekStart());

  // const existing = useMemo(
  //   () => reports.find((r) => r.userId === user!.id && r.weekStart === weekStart),
  //   [reports, user, weekStart]
  // );


  const { data: report } = useQuery({
    queryKey: ['report', weekStart],
    queryFn: () => getReport({
      date: new Date(weekStart)
    })
  })

  const existing = report

  const {data: projects = []} = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects
  })

  // const isDemoUser = user?.id?.startsWith("demo")

  const readOnly = !!existing && existing.status !== "draft" && existing.status !== "rejected";

  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    setEntries(
      existing?.timeEntries?.length ?
        existing?.timeEntries : [{
          id: crypto.randomUUID(),
          projectId: projects[0]?.id ?? "",
          date: weekStart,
          hoursWorked: 8,
          description: "",
        }]
    )
  }, [report]) // Change ReportResponse(TimeEntry name of hoursWorked to hours)

  // Reset when week changes
  const onChangeWeek = (delta: number) => {
    const next = isoDate(addDays(weekStart, delta * 7));
    setWeekStart(next);
    const found = reports.find((r) => r.userId === user!.id && r.weekStart === next);
    if (found) {
      setEntries(found.entries);
    } else {
      setEntries([{ id: crypto.randomUUID(), projectId: projects[0]?.id ?? "", date: next, hoursWorked: 8, description: "" }]);
    }
  };

  const updateEntry = (id: string, patch: Partial<TimeEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: "", projectId: "", date: weekStart, hoursWorked: 0, description: "" },
    ]);
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const validate = (): string | null => {
    if (entries.length === 0) return "Add at least one time entry.";
    for (const e of entries) {
      if (!e.projectId) return "Every entry needs a project.";
      if (!e.hoursWorked || e.hoursWorked <= 0) return "Hours must be greater than zero.";
      if (e.hoursWorked > 24) return "Hours per entry cannot exceed 24.";
      if (!e.description.trim()) return "Add a short description for each entry.";
    }
    return null;
  };

  const buildReport = (status: WeeklyReport["status"]): WeeklyReport => ({
    id: existing?.id ?? "",
    userId: user!.id,
    weekStart,
    entries,
    status,
    submittedAt: status === "submitted" ? new Date().toISOString() : existing?.submittedAd,
  });

  const onSaveDraft = () => {
    const payload: TimeEntryRequest[] = entries.map((e) => ({
      projectId: e.projectId,
      hoursWorked: e.hoursWorked,
      date: new Date(e.date).toISOString().split('T')[0],
      description: e.description || "",
      reportId: report?.id || ""
    }))
    // upsertReport(buildReport("draft"));
    console.log(payload)
    var result = timeEntryService.create(payload)
    // send to db
    toast.success("Draft saved");
  };


  const onSubmit = () => {
    const err = validate();
    if (err) return toast.error(err);

    upsertReport(buildReport("submitted"));
    // we dont have the weekly report for real users yet
    toast.success("Report submitted for verification");
    navigate({ to: "/history" });
  };

  const total = totalHours(entries);
  const days = Array.from({ length: 7 }, (_, i) => isoDate(addDays(weekStart, i)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly time report</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log hours for the selected week.</p>
        </div>
        {/* {existing && <StatusBadge status={existing.status} />} */}
      </div>

      {readOnly && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-info">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            This report has already been {existing!.status} and is read-only.
            {existing?.feedBack && <p className="mt-1 text-foreground/80">Feedback: {existing.feedBack}</p>}
          </div>
        </div>
      )}

      {existing?.status === "rejected" && existing.feedBack && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Rejected by team leader</p>
            <p className="mt-1 text-foreground/80">{existing.feedBack}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onChangeWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2">
              <p className="text-sm font-semibold">{formatWeekRange(weekStart)}</p>
              <p className="text-xs text-muted-foreground">Week of {formatShortDate(weekStart)}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => onChangeWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart())} className="ml-2">
              This week
            </Button>
          </div>
          <div className="rounded-lg bg-muted px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold">{total}h</span>
          </div>
        </div>

        {/* Day chips */}
        <div className="grid grid-cols-7 border-b text-center text-xs">
          {days.map((d) => {
            const dayHours = entries.filter((e) => e.date === d).reduce((s, e) => s + (e.hoursWorked || 0), 0);
            return (
              <div key={d} className="border-r px-2 py-3 last:border-r-0">
                <p className="text-muted-foreground">{dayLabel(d)}</p>
                <p className="mt-1 font-medium">{new Date(d).getDate()}</p>
                <p className="mt-1 text-xs text-primary">{dayHours > 0 ? `${dayHours}h` : "—"}</p>
              </div>
            );
          })}
        </div>

        <div className="divide-y">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="grid gap-3 p-4 md:grid-cols-12 md:items-start md:gap-4">
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Project</label>
                <Select
                  value={entry.projectId}
                  onValueChange={(v) => updateEntry(entry.id, { projectId: v })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <Select value={entry.date} onValueChange={(v) => updateEntry(entry.id, { date: v })} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>
                        {dayLabel(d)} · {formatShortDate(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Hours</label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.25}
                  value={entry.hoursWorked}
                  onChange={(e) => updateEntry(entry.id, { hoursWorked: parseFloat(e.target.value) || 0 })}
                  disabled={readOnly}
                />
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  rows={1}
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                  placeholder="What did you work on?"
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-end justify-end md:col-span-1 md:pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  disabled={readOnly || entries.length === 1}
                  aria-label={`Remove entry ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={addEntry} disabled={readOnly}>
            <Plus className="mr-2 h-4 w-4" /> Add entry
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSaveDraft} disabled={readOnly}>
              <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
            <Button onClick={onSubmit} disabled={readOnly}>
              <Send className="mr-2 h-4 w-4" /> Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
