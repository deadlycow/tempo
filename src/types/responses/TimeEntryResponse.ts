interface TimeEntryResponse {
  id: string,
  projectId: string,
  employeeId: string,
  hoursWorked?: number,
  date?: Date,
  description?: string,
}
export {
  TimeEntryResponse
}