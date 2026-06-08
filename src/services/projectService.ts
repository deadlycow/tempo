import type { CreateProjectRequest, GetProjectRequest } from "@/types/requests/ProjectRequest"
import type { ProjectResponse } from "@/types/responses/ProjectResponse"
const baseUrl = 'http://localhost:5078/'

const createProject = async (data: CreateProjectRequest) => {
  const response = await fetch(`${baseUrl}api/project`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })
  return response.json()
}
const getProject = async (data: GetProjectRequest) => {
  const response = await fetch(`${baseUrl}api/project`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

const getAllProjects = async (): Promise<ProjectResponse[]> => {
  const response = await fetch(`${baseUrl}api/project/all`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok)
    throw new Error("Failed to fetch projects")

  return await response.json()
}

export {
  createProject,
  getProject,
  getAllProjects
}