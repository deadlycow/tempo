import { Role } from "@/lib/types";

interface UserResponse {
  email: string,
  userId?: string,
  userName?: string,
  role: Role,
}
export {
  UserResponse
}