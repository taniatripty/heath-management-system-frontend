import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PaymentPage() {
  return (
    <main className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader className="items-center text-center">
          <Badge variant="secondary">Payment complete</Badge>
          <CardTitle className="mt-3 text-2xl">
            Your payment was successful
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Your appointment payment has been submitted. You can review its status
          in your appointments.
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/myAppointment" />}
          >
            View my appointments
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
