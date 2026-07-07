import type { Role } from "@/lib/types"

interface LoginRequest {
  email: string,
  password: string
}
interface RegisterRequest {
  name: string,
  email: string,
  password: string,
  phoneNumber?: string,
  role: Role
}
export {
  LoginRequest,
  RegisterRequest
}