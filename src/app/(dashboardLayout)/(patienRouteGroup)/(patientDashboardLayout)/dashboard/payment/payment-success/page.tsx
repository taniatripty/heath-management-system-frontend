import { redirect } from "next/navigation"

const PaymentSuccessPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) => {
  const { session_id: sessionId } = await searchParams
  const query = sessionId
    ? `?${new URLSearchParams({ session_id: sessionId }).toString()}`
    : ""

  redirect(`/payment/success${query}`)
}

export default PaymentSuccessPage
