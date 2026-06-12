import type { TimeEntry } from "@/types/timeEntries";
import { addDays } from "./mock-data";

export function totalHours(entries: TimeEntry[]): number {
  return Math.round(entries.reduce((s, e) => s + (Number(e.hoursWorked) || 0), 0) * 100) / 100;
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = sameMonth
    ? end.toLocaleDateString(undefined, { day: "numeric", year: "numeric" })
    : end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export function dayLabel(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short" });
}
