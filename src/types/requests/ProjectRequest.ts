interface CreateProjectRequest {
  name: string,
  description?: string,
  startDate: Date,
  endDate: Date,
}
interface GetProjectRequest {
  id: string,
  includeTimeEntries: boolean,
}
interface DeleteProjectRequest {
  id: string
}
interface UpdateProjectRequest {
  id: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate?: Date
}

export {
  CreateProjectRequest,
  GetProjectRequest,
  DeleteProjectRequest,
  UpdateProjectRequest
}