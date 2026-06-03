import type { UserResponse } from '@/types/responses/UserResponse'
import type { RegisterRequest } from '@/types/requests/AuthRequest'

const baseUrl = 'http://localhost:5078/'

const me = async (): Promise<UserResponse> => {
    const response = await fetch(`${baseUrl}api/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    if (!response.ok)
        throw new Error("Failed to fetch user data")
    return response.json()
}

const registerUser = async (data: RegisterRequest) => {
    console.log("Registering user with data:", data)
    const response = await fetch(`${baseUrl}api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    if (!response.ok)
        throw new Error('Registration failed')
    return response.json();
}

export {
    me,
    registerUser
}