interface CreateTimeEntryRequest {
  projectId: string,
  employeeId: string,
  hoursWorked: number,
  date: Date,
  description?: string
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
  CreateTimeEntryRequest,
  GetTimeEntryRequest,
  UpdateTimeEntryRequest,
  DeleteTimeEntryRequest,
  GetAllTimeEntryByUserIdRequest
}