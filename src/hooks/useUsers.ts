import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, updateUserRole } from "@/services/userService"
import type { Role } from "@/lib/types"

const useUsers = () => useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers
})

const useUpdateUserRole = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: Role }) => updateUserRole(userId, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    })
}

export { useUsers, useUpdateUserRole }
