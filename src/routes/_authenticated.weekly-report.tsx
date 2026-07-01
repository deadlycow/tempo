import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addDays, dayLabel, formatShortDate, formatWeekRange, getWeekStart, isoDate, totalHours } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { TimeEntry } from "@/types/timeEntries";
import { Status } from "@/Enum/Status";
import * as reportService from "@/services/reportService"
import { useProjects } from "@/hooks/useProjects";
import { useReport } from "@/hooks/useReports";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/weekly-report")({
  component: WeeklyReportPage,
});

const EDITABLE = new Set([Status.draft, Status.rejected])

function defaultEntry(weekStart: string): TimeEntry {
  return { id: crypto.randomUUID(), projectId: "", date: weekStart, hoursWorked: 0, description: "" }
}

function WeeklyReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState<string>(getWeekStart());
  const [editableEntries, setEditableEntries] = useState<TimeEntry[]>([defaultEntry(getWeekStart())]);
  const initializedWeek = useRef<string | null>(null);

  const { data: weekReports = [] } = useReport(weekStart);
  const { data: projects = [] } = useProjects();

  // Sync editable entries when reports load for a new week
  useEffect(() => {
    if (initializedWeek.current === weekStart) return;
    if (weekReports.length === 0 && initializedWeek.current !== null) {
      setEditableEntries([defaultEntry(weekStart)]);
      initializedWeek.current = weekStart;
      return;
    }
    const editableReports = weekReports.filter((r) => EDITABLE.has(r.status as Status));
    const entries = editableReports.flatMap((r) => r.timeEntries);
    setEditableEntries(entries.length > 0 ? entries : [defaultEntry(weekStart)]);
    initializedWeek.current = weekStart;
  }, [weekReports, weekStart]);

  const lockedReports = useMemo(
    () => weekReports.filter((r) => !EDITABLE.has(r.status as Status)),
    [weekReports]
  );
  const lockedEntries = useMemo(
    () => lockedReports.flatMap((r) => r.timeEntries),
    [lockedReports]
  );
  const rejectedReports = useMemo(
    () => weekReports.filter((r) => r.status === Status.rejected && r.feedback),
    [weekReports]
  );

  const onChangeWeek = (delta: number) => {
    initializedWeek.current = null;
    setWeekStart(isoDate(addDays(weekStart, delta * 7)));
  };

  const updateEntry = (id: string, patch: Partial<TimeEntry>) =>
    setEditableEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const addEntry = () =>
    setEditableEntries((prev) => [...prev, defaultEntry(weekStart)]);

  const removeEntry = (id: string) =>
    setEditableEntries((prev) => prev.filter((e) => e.id !== id));

  const validate = (): string | null => {
    const filled = editableEntries.filter((e) => e.projectId);
    if (filled.length === 0) return "Add at least one time entry with a project selected.";
    for (const e of filled) {
      if (!e.hoursWorked || e.hoursWorked <= 0) return "Hours must be greater than zero.";
      if (e.hoursWorked > 24) return "Hours per entry cannot exceed 24.";
    }
    return null;
  };

  const onSaveDraft = async () => {
    await reportService.saveReport({ weekStart, status: Status.draft, timeEntries: editableEntries });
    queryClient.invalidateQueries({ queryKey: ['report', weekStart] });
    toast.success("Draft saved");
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) return toast.error(err);
    const now = new Date().toISOString();
    await reportService.saveReport({ weekStart, status: Status.submitted, timeEntries: editableEntries, submittedAt: now });
    queryClient.invalidateQueries({ queryKey: ['report', weekStart] });
    toast.success("Report submitted for verification");
    navigate({ to: "/history" });
  };

  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const total = totalHours([...editableEntries, ...lockedEntries]);
  const editableTotal = totalHours(editableEntries);
  const days = Array.from({ length: 7 }, (_, i) => isoDate(addDays(weekStart, i)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly time report</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log hours for the selected week.</p>
        </div>
        {weekReports.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {weekReports.map((r) => (
              <div key={r.id} className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 text-xs">
                <span className="font-medium text-muted-foreground">{projectNameById.get(r.projectId ?? "") ?? "Unknown"}</span>
                <StatusBadge status={r.status ?? Status.noStatus} />
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectedReports.map((r) => (
        <div key={r.id} className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">
              {projectNameById.get(r.projectId ?? "") ?? "Project"} — Rejected by team leader
            </p>
            <p className="mt-1 text-foreground/80">{r.feedback}</p>
          </div>
        </div>
      ))}

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
            <Button variant="ghost" size="sm" onClick={() => { initializedWeek.current = null; setWeekStart(getWeekStart()); }} className="ml-2">
              This week
            </Button>
          </div>
          <div className="rounded-lg bg-muted px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold">{total}h</span>
            {lockedEntries.length > 0 && (
              <span className="text-muted-foreground"> ({editableTotal}h editable)</span>
            )}
          </div>
        </div>

        {/* Day chips */}
        <div className="grid grid-cols-7 border-b text-center text-xs">
          {days.map((d) => {
            const dayHours = [...editableEntries, ...lockedEntries]
              .filter((e) => e.date === d)
              .reduce((s, e) => s + (e.hoursWorked || 0), 0);
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
          {/* Locked (read-only) entries */}
          {lockedEntries.map((entry) => (
            <div key={entry.id} className="grid gap-3 p-4 opacity-60 md:grid-cols-12 md:items-start md:gap-4 bg-muted/20">
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Project</label>
                <p className="py-2 text-sm font-medium">{projectNameById.get(entry.projectId) ?? "—"}</p>
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <p className="py-2 text-sm">{formatShortDate(entry.date)}</p>
              </div>
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Hours</label>
                <p className="py-2 text-sm font-medium">{entry.hoursWorked}h</p>
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <p className="py-2 text-sm text-muted-foreground">{entry.description || "—"}</p>
              </div>
              <div className="md:col-span-1" />
            </div>
          ))}

          {/* Editable entries */}
          {editableEntries.map((entry, idx) => (
            <div key={entry.id} className="grid gap-3 p-4 md:grid-cols-12 md:items-start md:gap-4">
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Project</label>
                <Select value={entry.projectId} onValueChange={(v) => updateEntry(entry.id, { projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <Select value={entry.date} onValueChange={(v) => updateEntry(entry.id, { date: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>{dayLabel(d)} · {formatShortDate(d)}</SelectItem>
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
                />
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  rows={1}
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex items-end justify-end md:col-span-1 md:pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  disabled={editableEntries.length === 1 && lockedEntries.length === 0}
                  aria-label={`Remove entry ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={addEntry}>
            <Plus className="mr-2 h-4 w-4" /> Add entry
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSaveDraft}>
              <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
            <Button onClick={onSubmit}>
              <Send className="mr-2 h-4 w-4" /> Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
