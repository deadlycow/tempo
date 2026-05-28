interface LoginRequest {
  email: string,
  password: string
}
interface RegisterRequest {
  userName: string,
  email: string,
  password: string,
  phoneNumber?: string,
  role: string
}
export {
  LoginRequest,
  RegisterRequest
}