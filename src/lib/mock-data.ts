import type { Project, User, WeeklyReport } from "./types";

// Helpers to generate weeks (Monday)
function mondayOf(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// export function isoDate(d: Date): string {
// return d.toISOString().slice(0, 10);
// }

export function isoDate(d: Date): string {
const date = new Date(d)
const y = date.getFullYear()
const m = String(date.getMonth() + 1).padStart(2, "0")
const day = String(date.getDate()).padStart(2, "0")
return `${y}-${m}-${day}`
}

export function addDays(d: Date | string, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export function getWeekStart(d: Date = new Date()): string {
  return isoDate(mondayOf(d));
}

function makeEntries(weekStart: string, projectIds: string[]): WeeklyReport["entries"] {
  const entries: WeeklyReport["entries"] = [];
  for (let i = 0; i < 5; i++) {
    const date = isoDate(addDays(weekStart, i));
    const projectId = projectIds[i % projectIds.length];
    entries.push({
      id: `${weekStart}-${i}`,
      projectId,
      date,
      hours: [8, 7.5, 8, 6, 8][i],
      description: ["Sprint planning & dev", "API integration", "Code review", "Bug fixing", "Feature build"][i],
    });
  }
  return entries;
}



const todayWeek = getWeekStart();
const lastWeek = isoDate(addDays(todayWeek, -7));
const twoWeeks = isoDate(addDays(todayWeek, -14));
const threeWeeks = isoDate(addDays(todayWeek, -21));
const fourWeeks = isoDate(addDays(todayWeek, -28));

export const seedReports: WeeklyReport[] = [
  // Anna
  { id: "r1", userId: "u1", weekStart: todayWeek, entries: makeEntries(todayWeek, ["p1", "p2"]), status: "draft" },
  { id: "r2", userId: "u1", weekStart: lastWeek, entries: makeEntries(lastWeek, ["p1", "p3"]), status: "submitted", submittedAt: new Date().toISOString() },
  { id: "r3", userId: "u1", weekStart: twoWeeks, entries: makeEntries(twoWeeks, ["p1"]), status: "verified", submittedAt: new Date().toISOString(), verifiedAt: new Date().toISOString(), reviewedBy: "u5" },
  { id: "r4", userId: "u1", weekStart: threeWeeks, entries: makeEntries(threeWeeks, ["p2", "p4"]), status: "sent", sentAt: new Date().toISOString(), verifiedAt: new Date().toISOString(), reviewedBy: "u5" },
  { id: "r5", userId: "u1", weekStart: fourWeeks, entries: makeEntries(fourWeeks, ["p1", "p5"]), status: "rejected", rejectedAt: new Date().toISOString(), feedback: "Please add task descriptions for Friday.", reviewedBy: "u5" },
  // Erik
  { id: "r6", userId: "u2", weekStart: todayWeek, entries: makeEntries(todayWeek, ["p2"]), status: "submitted", submittedAt: new Date().toISOString() },
  { id: "r7", userId: "u2", weekStart: lastWeek, entries: makeEntries(lastWeek, ["p2", "p4"]), status: "verified", verifiedAt: new Date().toISOString(), reviewedBy: "u5" },
  { id: "r8", userId: "u2", weekStart: twoWeeks, entries: makeEntries(twoWeeks, ["p3"]), status: "sent", sentAt: new Date().toISOString(), reviewedBy: "u5" },
  // Sofia
  { id: "r9", userId: "u3", weekStart: todayWeek, entries: makeEntries(todayWeek, ["p4", "p5"]), status: "submitted", submittedAt: new Date().toISOString() },
  { id: "r10", userId: "u3", weekStart: lastWeek, entries: makeEntries(lastWeek, ["p4"]), status: "verified", verifiedAt: new Date().toISOString(), reviewedBy: "u5" },
  // Marcus
  { id: "r11", userId: "u4", weekStart: todayWeek, entries: makeEntries(todayWeek, ["p1", "p3"]), status: "submitted", submittedAt: new Date().toISOString() },
  { id: "r12", userId: "u4", weekStart: lastWeek, entries: makeEntries(lastWeek, ["p1"]), status: "verified", verifiedAt: new Date().toISOString(), reviewedBy: "u5" },
  { id: "r13", userId: "u4", weekStart: twoWeeks, entries: makeEntries(twoWeeks, ["p3", "p5"]), status: "sent", sentAt: new Date().toISOString(), reviewedBy: "u5" },
];

export const users: User[] = [
  { id: "demo-u1", name: "Anna Lindqvist", email: "anna@acme.co", role: "employee", team: "Platform" },
  { id: "demo-u2", name: "Erik Johansson", email: "erik@acme.co", role: "employee", team: "Platform" },
  { id: "demo-u3", name: "Sofia Berg", email: "sofia@acme.co", role: "employee", team: "Platform" },
  { id: "demo-u4", name: "Marcus Nyström", email: "marcus@acme.co", role: "employee", team: "Platform" },
  { id: "demo-u5", name: "Karin Holm", email: "karin@acme.co", role: "team_leader", team: "Platform" },
  { id: "demo-u6", name: "Oliver Admin", email: "admin@acme.co", role: "admin", team: "Operations" },
];

export const projects: Project[] = [
  { id: "p1", name: "Atlas Migration", client: "Northwind", color: "oklch(0.65 0.18 258)" },
  { id: "p2", name: "Phoenix Mobile", client: "Globex", color: "oklch(0.7 0.16 155)" },
  { id: "p3", name: "Internal Platform", client: "Internal", color: "oklch(0.78 0.16 75)" },
  { id: "p4", name: "Customer Portal", client: "Initech", color: "oklch(0.65 0.14 230)" },
  { id: "p5", name: "Data Warehouse", client: "Umbrella", color: "oklch(0.65 0.22 25)" },
];
