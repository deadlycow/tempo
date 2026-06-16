import { GetReportRequest, Report } from "@/types/reports"
// import { ReportResponse } from "@/types/responses/ReportResponse"

const baseUrl = "http://localhost:5078/"

const getReport = async (data: GetReportRequest): Promise<Report | null> => {
    const response = await fetch(`${baseUrl}api/report`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: data.date.toISOString().split('T')[0]
        })
    })
    if (response.status === 404)
        return null

    return response.json()
}
const saveReport = async (data: Report) => {
    const response = await fetch(`${baseUrl}api/report/upsert`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    if (!response.ok)
        return null

    return response.status
}
export {
    getReport,
    saveReport
}