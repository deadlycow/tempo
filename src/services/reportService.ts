import { GetReportRequest, Report, ReportResponse } from "@/types/reports"

const baseUrl = "http://localhost:3000/"

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
const getReports = async (): Promise<Report[]> => {
    const response = await fetch(`${baseUrl}api/report/all/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    if (!response.ok)
        return []

    const data = await response.json();

    return data
}
const updateReportStatus = async (reportId: string, data: {
    status: string
    feedback?: string
    verifiedAt?: string
    rejectedAt?: string
    forwardedAt?: string
    sentAt?: string
}) => {
    const response = await fetch(`${baseUrl}api/report/${reportId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!response.ok) return null
    return response.status
}

export {
    getReports,
    getReport,
    saveReport,
    updateReportStatus
}