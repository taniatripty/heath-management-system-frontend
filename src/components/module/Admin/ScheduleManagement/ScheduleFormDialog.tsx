"use client"

import { Dialog } from "@base-ui/react/dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createSchedule,
  updateSchedule,
} from "@/services/schedule.services"
import type { ISchedule, ISchedulePayload } from "@/types/schedule.types"

interface ScheduleFormDialogProps {
  open: boolean
  schedule?: ISchedule | null
  onOpenChange: (open: boolean) => void
}

const getDateValue = (value?: string | Date) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd")
}

const getTimeValue = (value?: string | Date) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : format(date, "HH:mm")
}

const ScheduleFormDialog = ({
  open,
  schedule = null,
  onOpenChange,
}: ScheduleFormDialogProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditing = Boolean(schedule)

  useEffect(() => {
    if (open) {
      formRef.current?.reset()
      setSubmitError(null)
    }
  }, [open, schedule])

  const scheduleMutation = useMutation({
    mutationFn: (payload: ISchedulePayload) =>
      schedule
        ? updateSchedule({ id: schedule.id, payload })
        : createSchedule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedules"] })
      formRef.current?.reset()
      setSubmitError(null)
      onOpenChange(false)
      toast.success(isEditing ? "Schedule updated." : "Schedule created.")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to save schedule."
      setSubmitError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const formData = new FormData(event.currentTarget)
    const payload: ISchedulePayload = {
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
    }
    const startDateTime = new Date(`${payload.startDate}T${payload.startTime}`)
    const endDateTime = new Date(`${payload.endDate}T${payload.endTime}`)

    if (
      Number.isNaN(startDateTime.getTime()) ||
      Number.isNaN(endDateTime.getTime()) ||
      endDateTime <= startDateTime
    ) {
      const message = "The end date and time must be after the start date and time."
      setSubmitError(message)
      toast.error(message)
      return
    }

    scheduleMutation.mutate(payload)
  }

  const closeDialog = () => {
    if (!scheduleMutation.isPending) {
      setSubmitError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !scheduleMutation.isPending) {
          setSubmitError(null)
          onOpenChange(false)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-background shadow-xl">
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {isEditing ? "Update schedule" : "Create schedules"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {isEditing
                  ? "Update the date and time for this schedule."
                  : "Choose a date range and daily time window. Available time slots will be created every 30 minutes."}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close schedule dialog"
              disabled={scheduleMutation.isPending}
              onClick={closeDialog}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                Start date
                <Input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={getDateValue(schedule?.startDateTime)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                End date
                <Input
                  name="endDate"
                  type="date"
                  required
                  defaultValue={getDateValue(schedule?.endDateTime)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                Start time
                <Input
                  name="startTime"
                  type="time"
                  required
                  defaultValue={getTimeValue(schedule?.startDateTime)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                End time
                <Input
                  name="endTime"
                  type="time"
                  required
                  defaultValue={getTimeValue(schedule?.endDateTime)}
                />
              </label>
            </div>

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={scheduleMutation.isPending}
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create schedules"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ScheduleFormDialog
