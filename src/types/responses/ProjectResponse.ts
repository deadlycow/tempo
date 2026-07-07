import type { TimeEntryResponse } from "./TimeEntryResponse"

interface ProjectLeader {
  leader: { id: string; name: string; email: string }
  assignedAt: string
}

interface ProjectResponse {
  id: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate?: Date,
  timeEntries?: TimeEntryResponse[]
  teamLeaders?: ProjectLeader[]
}

export {
  ProjectResponse,
  ProjectLeader
}