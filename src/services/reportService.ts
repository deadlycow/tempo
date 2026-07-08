import { Report } from "@/types/reports"

const baseUrl = "http://localhost:3000/"

const getWeekReports = async (weekStart: string): Promise<Report[]> => {
    const response = await fetch(`${baseUrl}api/report/week?weekStart=${weekStart}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) return []
    return response.json()
}

const saveReport = async (data: {
    weekStart: string
    status: string
    timeEntries: Report['timeEntries']
    submittedAt?: string
    feedback?: string
}) => {
    const response = await fetch(`${baseUrl}api/report/upsert`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!response.ok) return null
    return response.status
}

const getReports = async (): Promise<Report[]> => {
    const response = await fetch(`${baseUrl}api/report/all/`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) return []
    return response.json()
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
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to update report status')
    }
    return response.status
}

export {
    getReports,
    getWeekReports,
    saveReport,
    updateReportStatus
}
