type ReportStatus = "draft" | "submitted" | "verified" | "rejected" | "sent";

interface TimeEntryRequest {
  // id: string,
  projectId: string,
  // employeeId: string,
  hoursWorked: number,
  date: string,
  description?: string,
  reportId?: string
}
interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  entries: TimeEntryRequest[];
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
  TimeEntryRequest,
  WeeklyReport,
  GetTimeEntryRequest,
  UpdateTimeEntryRequest,
  DeleteTimeEntryRequest,
  GetAllTimeEntryByUserIdRequest,
  ReportStatus
}