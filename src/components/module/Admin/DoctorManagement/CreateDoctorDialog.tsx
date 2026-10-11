"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog } from "@base-ui/react/dialog"
import { useRef, useState } from "react"
import { z } from "zod"
import { X } from "lucide-react"
import { toast } from "sonner"
import { createDoctor, getSpecialties } from "@/services/doctor.services"
import { Gender } from "@/types/doctor.types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const createDoctorSchema = z
  .object({
    password: z
      .string("Password is required")
      .min(6, "Password must be at least 6 characters")
      .max(20, "Password must be at most 20 characters"),
    doctor: z
      .object({
        name: z
          .string("Name is required and must be string")
          .trim()
          .min(5, "Name must be at least 5 characters")
          .max(30, "Name must be at most 30 characters"),
        email: z.email("Invalid email address"),
        profilePhoto: z.string("Profile photo must be a string").optional(),
        contactNumber: z
          .string("Contact number must be a string")
          .min(11, "Contact number must be at least 11 characters")
          .max(14, "Contact number must be at most 14 characters")
          .optional(),
        address: z
          .string("Address must be a string")
          .min(10, "Address must be at least 10 characters")
          .max(100, "Address must be at most 100 characters")
          .optional(),
        registrationNumber: z
          .string("Registration number is required")
          .min(1, "Registration number is required"),
        experience: z
          .number("Experience must be an integer")
          .int("Experience must be an integer")
          .nonnegative("Experience cannot be negative")
          .optional(),
        gender: z.enum(
          [Gender.MALE, Gender.FEMALE],
          "Gender must be either MALE or FEMALE",
        ),
        appointmentFee: z
          .number("Appointment fee must be a number")
          .nonnegative("Appointment fee cannot be negative"),
        qualification: z
          .string("Qualification is required")
          .min(2, "Qualification must be at least 2 characters")
          .max(50, "Qualification must be at most 50 characters"),
        currentWorkingPlace: z
          .string("Current working place is required")
          .min(2, "Current working place must be at least 2 characters")
          .max(50, "Current working place must be at most 50 characters"),
        designation: z
          .string("Designation is required")
          .min(2, "Designation must be at least 2 characters")
          .max(50, "Designation must be at most 50 characters"),
      })
      .strict(),
    specialties: z
      .array(z.uuid(), "Specialties must be an array of strings")
      .min(1, "At least one specialty is required"),
  })
  .strict()

interface CreateDoctorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateDoctorDialog = ({
  open,
  onOpenChange,
}: CreateDoctorDialogProps) => {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const specialtiesQuery = useQuery({
    queryKey: ["specialties"],
    queryFn: getSpecialties,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })
  const createDoctorMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] })
      formRef.current?.reset()
      setSelectedSpecialties([])
      setSubmitError(null)
      onOpenChange(false)
      toast.success("Doctor created successfully.")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create doctor."
      setSubmitError(message)
      toast.error(message)
    },
  })

  const toggleSpecialty = (specialtyId: string, checked: boolean) => {
    setSelectedSpecialties((current) =>
      checked
        ? [...current, specialtyId]
        : current.filter((id) => id !== specialtyId),
    )
    setSubmitError(null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const formData = new FormData(event.currentTarget)
    const optionalString = (name: string) => {
      const value = formData.get(name)
      return typeof value === "string" && value.trim() ? value.trim() : undefined
    }
    const experience = optionalString("experience")
    const payload = {
      password: String(formData.get("password") ?? ""),
      doctor: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? "").trim(),
        profilePhoto: optionalString("profilePhoto"),
        contactNumber: optionalString("contactNumber"),
        address: optionalString("address"),
        registrationNumber: String(formData.get("registrationNumber") ?? "").trim(),
        experience: experience ? Number(experience) : undefined,
        gender: String(formData.get("gender") ?? ""),
        appointmentFee: Number(formData.get("appointmentFee")),
        qualification: String(formData.get("qualification") ?? "").trim(),
        currentWorkingPlace: String(formData.get("currentWorkingPlace") ?? "").trim(),
        designation: String(formData.get("designation") ?? "").trim(),
      },
      specialties: selectedSpecialties,
    }
    const parsedPayload = createDoctorSchema.safeParse(payload)

    if (!parsedPayload.success) {
      const message = parsedPayload.error.issues
        .map(({ message }) => message)
        .join(" ")
      setSubmitError(message)
      toast.error(message)
      return
    }

    createDoctorMutation.mutate(parsedPayload.data)
  }

  const closeDialog = () => {
    setSubmitError(null)
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSubmitError(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Create doctor
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Enter the doctor&apos;s details and choose at least one specialty.
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close create doctor modal"
              onClick={closeDialog}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="overflow-y-auto px-6 py-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" name="name">
                <Input id="name" name="name" required minLength={5} maxLength={30} />
              </FormField>
              <FormField label="Email" name="email">
                <Input id="email" name="email" type="email" required />
              </FormField>
              <FormField label="Password" name="password">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={20}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Profile photo URL" name="profilePhoto">
                <Input id="profilePhoto" name="profilePhoto" type="url" />
              </FormField>
              <FormField label="Contact number" name="contactNumber">
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  minLength={11}
                  maxLength={14}
                />
              </FormField>
              <FormField label="Registration number" name="registrationNumber">
                <Input id="registrationNumber" name="registrationNumber" required />
              </FormField>
              <FormField label="Experience (years)" name="experience">
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min={0}
                  step={1}
                />
              </FormField>
              <FormField label="Gender" name="gender">
                <select
                  id="gender"
                  name="gender"
                  required
                  defaultValue=""
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </FormField>
              <FormField label="Appointment fee" name="appointmentFee">
                <Input
                  id="appointmentFee"
                  name="appointmentFee"
                  type="number"
                  min={0}
                  step="any"
                  required
                />
              </FormField>
              <FormField label="Qualification" name="qualification">
                <Input
                  id="qualification"
                  name="qualification"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </FormField>
              <FormField label="Current working place" name="currentWorkingPlace">
                <Input
                  id="currentWorkingPlace"
                  name="currentWorkingPlace"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </FormField>
              <FormField label="Designation" name="designation">
                <Input
                  id="designation"
                  name="designation"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </FormField>
              <FormField label="Address" name="address" className="sm:col-span-2">
                <textarea
                  id="address"
                  name="address"
                  minLength={10}
                  maxLength={100}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </FormField>
            </div>

            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-sm font-medium">Specialties</legend>
              {specialtiesQuery.isPending ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Loading specialties...
                </p>
              ) : specialtiesQuery.isError ? (
                <div className="flex items-center gap-3 text-sm">
                  <p className="text-destructive" role="alert">
                    {specialtiesQuery.error instanceof Error
                      ? specialtiesQuery.error.message
                      : "Unable to load specialties."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void specialtiesQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : specialtiesQuery.data.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specialties are available.
                </p>
              ) : (
                <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  {specialtiesQuery.data.data.map((specialty) => (
                    <label
                      key={specialty.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedSpecialties.includes(specialty.id)}
                        onCheckedChange={(checked) =>
                          toggleSpecialty(specialty.id, checked === true)
                        }
                      />
                      {specialty.title}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {submitError && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createDoctorMutation.isPending ||
                  specialtiesQuery.isPending ||
                  specialtiesQuery.isError ||
                  specialtiesQuery.data?.data.length === 0
                }
              >
                {createDoctorMutation.isPending ? "Creating..." : "Create doctor"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface FormFieldProps {
  label: string
  name: string
  className?: string
  children: React.ReactNode
}

const FormField = ({ label, name, className, children }: FormFieldProps) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <label htmlFor={name} className="text-sm font-medium">
      {label}
    </label>
    {children}
  </div>
)

export default CreateDoctorDialog
