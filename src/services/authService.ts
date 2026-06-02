import type { LoginRequest, RegisterRequest } from "@/types/requests/AuthRequst"
// import type { AuthResponse } from "@/types/responses/UserResponse"


const baseUrl = "http://localhost:5078/"

const logIn = async (data: LoginRequest): Promise<boolean> => {
  const res = await fetch(`${baseUrl}api/auth/login`, {
    "method": "POST",
    "credentials": "include",
    "headers": {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  if (!res.ok)
    throw new Error("Login failed")

  return res.ok
}

const registerUser = async (data: RegisterRequest) => {
  const res = await fetch(`${baseUrl}api/auth/register`, {
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  return res.json();
}

export {
  logIn,
  registerUser
}