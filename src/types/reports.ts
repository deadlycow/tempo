import { Status } from "@/Enum/Status"
import { TimeEntry } from "@/types/timeEntries"

interface Report {
  id?: string
  userId?: string
  projectId?: string
  weekStart: string
  timeEntries: TimeEntry[]
  status?: Status
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  forwardedAt?: string
  sentAt?: string
  feedback?: string
  reviewedBy?: string
}

interface ReportResponse {
  id?: string
  userId?: string
  projectId?: string
  timeEntries: TimeEntry[]
  status?: Status
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  forwardedAt?: string
  sentAt?: string
  feedback?: string
  reviewedBy?: string
}

export {
  Report,
  ReportResponse
}
