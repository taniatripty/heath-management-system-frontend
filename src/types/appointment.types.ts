export interface IAppointmentPayload {
  doctorId: string
  scheduleId: string
}

export interface IAppointment {
  id: string
  status?: string
  paymentStatus?: string
  createdAt?: string | Date
  doctor?: {
    id?: string | number
    name?: string
    profilePhoto?: string
    appointmentFee?: number
  }
  schedule?: {
    id?: string
    startDateTime?: string | Date
    endDateTime?: string | Date
  }
  payment?: {
    id?: string
    status?: string
    amount?: number
  } | null
}

export interface IAppointmentResult {
  id?: string
  appointmentId?: string
  appointment?: IAppointment
  paymentUrl?: string
  payment?: {
    id?: string
    status?: string
    amount?: number
  }
}

export interface IPaymentLink {
  data?: {
    url?: string
    paymentUrl?: string
    checkoutUrl?: string
  }
  url?: string
  paymentUrl?: string
  checkoutUrl?: string
  payment?: {
    url?: string
    paymentUrl?: string
    checkoutUrl?: string
  }
}

export type IInitiatePaymentResult =
  | {
      success: true
      data: IPaymentLink
    }
  | {
      success: false
      message: string
    }
