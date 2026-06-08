import type { TimeEntryResponse } from "./TimeEntryResponse"

interface ProjectResponse {
  id: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate?: Date,
  timeEntries?: TimeEntryResponse[]
}

export {
  ProjectResponse
}