import { getAllProjects } from "@/services/projectService"
import { useQuery } from "@tanstack/react-query"

const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: getAllProjects
    })
}

export {
    useProjects
}