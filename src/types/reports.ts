import { Status } from "@/Enum/Status"
import { TimeEntry } from "@/types/timeEntries"

interface GetReportRequest {
  date: Date,
}
interface Report {
  id?: string
  userId?: string
  weekStart: string // ISO yyyy-mm-dd (Monday)
  timeEntries: TimeEntry[]
  status?: Status
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  sentAt?: string
  feedback?: string
  reviewedBy?: string
}
interface ReportResponse {
  id?: string
  userId?: string
  timeEntries: TimeEntry[]
  status?: Status
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  sentAt?: string
  feedback?: string
  reviewedBy?: string
}
export {
  GetReportRequest,
  Report,
  ReportResponse
}