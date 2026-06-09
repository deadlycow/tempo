export type Role = "employee" | "team_leader" | "admin" | "project_manager";

export type ReportStatus = "draft" | "submitted" | "verified" | "rejected" | "sent";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  team?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string; // ISO yyyy-mm-dd
  hours: number;
  description: string;
}

export interface WeeklyReport {
  id: string;
  userId?: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  entries: TimeEntry[];
  status: ReportStatus;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  sentAt?: string;
  feedback?: string;
  reviewedBy?: string;
}
