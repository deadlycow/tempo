import type { LoginRequest, RegisterRequest } from "@/types/requests/AuthRequst"
import type { AuthResponse } from "@/types/responses/AuthResponse"

const logIn = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await fetch("api/auth", {
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  if (!res.ok)
    throw new Error("Login failed")

  return res.json()
}

const registerUser = async (data: RegisterRequest) => {
  const res = await fetch("api/auth", {
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