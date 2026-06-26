import { useQuery } from "@tanstack/react-query"
import { getAllUsers } from "@/services/userService"

const useUsers = () => useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers
})

export { useUsers }
