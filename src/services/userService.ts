import { UserResponse } from "@/types/responses/UserResponse";
const baseUrl = 'http://localhost:5078/'

const me = async (): Promise<UserResponse> => {
    const response = await fetch(`${baseUrl}api/users/me`, {
        'method': 'GET',
        'credentials': 'include',
        'headers': {
            'Content-Type': 'application/json'
        }
    })
    if (!response.ok)
        throw new Error("Failed to fetch user data")

    return response.json()
}

export { me }