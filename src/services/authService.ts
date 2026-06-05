import type { LoginRequest } from '@/types/requests/AuthRequest'

const baseUrl = "http://localhost:5078/"

const login = async (data: LoginRequest): Promise<boolean> => {
  const response = await fetch(`${baseUrl}api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok)
    throw new Error("Login failed")

  return response.ok
}

const logout = async () => {
  await fetch(`${baseUrl}api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  }
  )
}

export {
  login,
  logout
}