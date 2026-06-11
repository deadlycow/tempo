import { GetReportRequest } from "@/types/requests/ReportRequest"
import { ReportResponse } from "@/types/responses/ReportResponse"

const baseUrl = 'http://localhost:5078/'

// const getReports = async () => {
//     const response = await fetch(`${baseUrl}/api/reports`)
// }

const getReport = async (data: GetReportRequest) : Promise<ReportResponse> => {
    const response = await fetch(`${baseUrl}api/report`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        })
    if (!response.ok)
        throw new Error('No report found')

    return await response.json()
}
export {
    // getReports,
    getReport
}