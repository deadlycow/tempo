import { TimeEntry } from "@/lib/types"

interface ReportResponse {
    id: string,
    timeEntries?: TimeEntry[],
    status: string,
    submittedAd?: string,
    verifiedAt?: string,
    rejectedAt?: string,
    sentAt?: string,
    feedBack?: string,
    reviewedBy?: string
}
export{
    ReportResponse
}