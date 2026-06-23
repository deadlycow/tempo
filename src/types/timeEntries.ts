interface TimeEntry {
  id: string,
  employeeId?: string,
  projectId: string,
  hoursWorked: number,
  date: string,
  description?: string,
  reportId?: string
}
export {
  TimeEntry
}