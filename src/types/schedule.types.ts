export interface ISchedule {
  id: string
  startDateTime: string | Date
  endDateTime: string | Date
  isBooked?: boolean
  appointment?: Array<{
    id?: string | number
    status?: string
    patient?: {
      name?: string
      email?: string
    } | null
  }> | null
}

export interface ISchedulePayload {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}
