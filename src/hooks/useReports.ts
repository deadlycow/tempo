import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/reportService"
const useReports = () => {
    return useQuery({
        queryKey: ['reports'],
        queryFn: reportService.getReports
    })
}

export {
    useReports
}