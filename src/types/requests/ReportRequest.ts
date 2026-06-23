import { TimeEntry } from "./TimeEntryRequest"

type Status = "draft" | "submitted" | "verified" | "rejected" | "sent"

interface Get {
  date: Date,
}
interface Upsert {
  id?: string
  userId?: string
  weekStart: string // ISO yyyy-mm-dd (Monday)
  entries: TimeEntry[]
  status: Status
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  sentAt?: string
  feedback?: string
  reviewedBy?: string
}
export {
  Get,
  Upsert
}