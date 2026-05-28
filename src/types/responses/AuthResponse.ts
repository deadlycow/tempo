interface AuthResponse {
  accessToken: string,
  email: string,
  userId: string,
  userName?: string,
  role: string,
  expiresAt: Date
}
export {
  AuthResponse
}