import type { TimeEntryResponse } from "./TimeEntryResponse"

interface ProjectLeader {
  leader: { id: string; name: string; email: string }
  assignedAt: string
}

interface ProjectManager {
  manager: { id: string; name: string; email: string }
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
  projectManagers?: ProjectManager[]
}

export {
  ProjectResponse,
  ProjectLeader,
  ProjectManager
}