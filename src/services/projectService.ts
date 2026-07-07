import type { CreateProjectRequest, GetProjectRequest } from "@/types/requests/ProjectRequest"
import { ProjectResponse } from "@/types/responses/ProjectResponse"

const baseUrl = 'http://localhost:3000/'

const createProject = async (data: CreateProjectRequest) => {
  const response = await fetch(`${baseUrl}api/project`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) return null
  return response.json()
}
const getProject = async (data: GetProjectRequest): Promise<ProjectResponse | null> => {
  const response = await fetch(`${baseUrl}api/project`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  if (response.status === 404)
    return null

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
  if (response.status === 404)
    return []

  return await response.json()
}

const assignLeader = async (projectId: string, leaderId: string) => {
  const response = await fetch(`${baseUrl}api/project/${projectId}/leaders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leaderId })
  })
  if (!response.ok) return null
  return response.status
}

const removeLeader = async (projectId: string, leaderId: string) => {
  const response = await fetch(`${baseUrl}api/project/${projectId}/leaders/${leaderId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) return null
  return response.status
}

export {
  createProject,
  getProject,
  getAllProjects,
  assignLeader,
  removeLeader
}