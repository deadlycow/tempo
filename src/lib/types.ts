export type Role = "employee" | "team_leader" | "admin" | "project_manager";

export type ReportStatus = "draft" | "submitted" | "verified" | "rejected" | "sent";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  isProjectLeader?: boolean;
  avatar?: string;
  team?: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string; // ISO yyyy-mm-dd
  hoursWorked: number;
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
