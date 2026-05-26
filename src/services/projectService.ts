import type { CreateProjectRequest, GetProjectRequest } from "@/types/requests/ProjectRequest"

const createProject = async (data: CreateProjectRequest) => {
  const res = await fetch("api/project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })
  return res.json()
}
const getProject = async (data: GetProjectRequest) => {
  const res = await fetch("api/project", {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export {
  createProject,
  getProject,
}