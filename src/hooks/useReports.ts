import { useQuery } from "@tanstack/react-query"
import * as reportService from "@/services/reportService"

const useReport = (weekStart: string) => {
    return useQuery({
        queryKey: ['report', weekStart],
        queryFn: () => reportService.getReport({
            date: new Date(weekStart)
        })
    })
}

const useReports = () => {
    return useQuery({
        queryKey: ['reports'],
        queryFn: reportService.getReports
    })
}

export {
    useReports,
    useReport
}