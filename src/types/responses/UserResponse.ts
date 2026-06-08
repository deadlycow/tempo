import { Role } from "@/lib/types";

interface UserResponse {
  email: string,
  userId?: string,
  name?: string,
  role: Role,
}
export {
  UserResponse
}