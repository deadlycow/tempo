type ReportStatus = "draft" | "submitted" | "verified" | "rejected" | "sent";

interface TimeEntry {
  id?: string,
  employeeId?: string,
  projectId: string,
  hoursWorked: number,
  date: string,
  description?: string,
  reportId?: string
}
interface WeeklyReport {
  id: string;
  userId: string;
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

interface GetTimeEntryRequest {
  id: string
}
interface UpdateTimeEntryRequest {
  id: string,
  projectId?: string,
  employeeId: string,
  hoursWorked?: number,
  date?: Date,
  description?: string
}
interface DeleteTimeEntryRequest {
  id: string
}
interface GetAllTimeEntryByUserIdRequest {
  id: string
}
export {
  TimeEntry,
  WeeklyReport,
  GetTimeEntryRequest,
  UpdateTimeEntryRequest,
  DeleteTimeEntryRequest,
  GetAllTimeEntryByUserIdRequest,
  ReportStatus
}