// import { TimeEntryRequest } from "@/types/requests/TimeEntryRequest"

// const baseUrl = 'http://localhost:5078/'

// const create = async (request: TimeEntryRequest[]) => {
//     // console.log(JSON.stringify(request, null, 2))
//     const response = await fetch(`${baseUrl}api/timeentry`, {
//         method: 'POST',
//         credentials: 'include',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(request)
//     })
//     if (!response.ok)
//         throw new Error("somthing")

//     return await response.json()
// }

// export {
//     create,
// }