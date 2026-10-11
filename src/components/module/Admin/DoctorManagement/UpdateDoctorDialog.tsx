"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog } from "@base-ui/react/dialog"
import { useState } from "react"
import { z } from "zod"
import { X } from "lucide-react"
import { toast } from "sonner"
import { getSpecialties, updateDoctor } from "@/services/doctor.services"
import { Gender, type IDoctor, type IUpdateDoctorPayload } from "@/types/doctor.types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const updateDoctorSchema = z
  .object({
    doctor: z
      .object({
        name: z.string().trim().min(5, "Name must be at least 5 characters").max(30),
        profilePhoto: z.string().optional(),
        contactNumber: z
          .string()
          .min(11, "Contact number must be at least 11 characters")
          .max(14, "Contact number must be at most 14 characters")
          .optional(),
        address: z
          .string()
          .min(10, "Address must be at least 10 characters")
          .max(100, "Address must be at most 100 characters")
          .optional(),
        registrationNumber: z.string().trim().min(1, "Registration number is required"),
        experience: z
          .number()
          .int("Experience must be an integer")
          .nonnegative("Experience cannot be negative")
          .optional(),
        gender: z.enum(Gender),
        appointmentFee: z.number().nonnegative("Appointment fee cannot be negative"),
        qualification: z.string().trim().min(2).max(50),
        currentWorkingPlace: z.string().trim().min(2).max(50),
        designation: z.string().trim().min(2).max(50),
      })
      .strict(),
    specialties: z.array(
      z.object({
        specialtyId: z.uuid(),
        shouldDelete: z.boolean(),
      }),
    ),
  })
  .strict()

interface UpdateDoctorDialogProps {
  open: boolean
  doctor: IDoctor
  onOpenChange: (open: boolean) => void
}

const UpdateDoctorDialog = ({
  open,
  doctor,
  onOpenChange,
}: UpdateDoctorDialogProps) => {
  const queryClient = useQueryClient()
  const initialSpecialtyIds = (doctor.specialties ?? []).flatMap(
    ({ specialtyId, speciatily }) => {
      const id = specialtyId ?? speciatily?.id
      return id ? [id] : []
    },
  )
  const [selectedSpecialties, setSelectedSpecialties] =
    useState<string[]>(initialSpecialtyIds)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const specialtiesQuery = useQuery({
    queryKey: ["specialties"],
    queryFn: getSpecialties,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })
  const updateDoctorMutation = useMutation({
    mutationFn: updateDoctor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] })
      setSubmitError(null)
      onOpenChange(false)
      toast.success("Doctor updated successfully.")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to update doctor."
      setSubmitError(message)
      toast.error(message)
    },
  })

  const toggleSpecialty = (specialtyId: string, checked: boolean) => {
    setSelectedSpecialties((current) =>
      checked
        ? current.includes(specialtyId)
          ? current
          : [...current, specialtyId]
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
      doctor: {
        name: String(formData.get("name") ?? ""),
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
      specialties: [
        ...initialSpecialtyIds
          .filter((specialtyId) => !selectedSpecialties.includes(specialtyId))
          .map((specialtyId) => ({ specialtyId, shouldDelete: true })),
        ...selectedSpecialties
          .filter((specialtyId) => !initialSpecialtyIds.includes(specialtyId))
          .map((specialtyId) => ({ specialtyId, shouldDelete: false })),
      ],
    }
    const parsedPayload = updateDoctorSchema.safeParse(payload)

    if (!parsedPayload.success) {
      const message = parsedPayload.error.issues
        .map(({ message }) => message)
        .join(" ")
      setSubmitError(message)
      toast.error(message)
      return
    }

    const updatePayload: IUpdateDoctorPayload = parsedPayload.data
    updateDoctorMutation.mutate({
      id: String(doctor.id),
      payload: updatePayload,
    })
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
                Update doctor
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Update {doctor.name}&apos;s details and specialties.
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close update doctor modal"
              onClick={closeDialog}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" name="name">
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={5}
                  maxLength={30}
                  defaultValue={doctor.name}
                />
              </FormField>
              <FormField label="Email" name="email">
                <Input id="email" name="email" type="email" value={doctor.email} disabled />
              </FormField>
              <FormField label="Profile photo URL" name="profilePhoto">
                <Input
                  id="profilePhoto"
                  name="profilePhoto"
                  type="url"
                  defaultValue={doctor.profilePhoto ?? ""}
                />
              </FormField>
              <FormField label="Contact number" name="contactNumber">
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  minLength={11}
                  maxLength={14}
                  defaultValue={doctor.contactNumber ?? ""}
                />
              </FormField>
              <FormField label="Registration number" name="registrationNumber">
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  required
                  defaultValue={doctor.registrationNumber}
                />
              </FormField>
              <FormField label="Experience (years)" name="experience">
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={doctor.experience ?? ""}
                />
              </FormField>
              <FormField label="Gender" name="gender">
                <select
                  id="gender"
                  name="gender"
                  required
                  defaultValue={doctor.gender}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
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
                  defaultValue={doctor.appointmentFee}
                />
              </FormField>
              <FormField label="Qualification" name="qualification">
                <Input
                  id="qualification"
                  name="qualification"
                  required
                  minLength={2}
                  maxLength={50}
                  defaultValue={doctor.qualification}
                />
              </FormField>
              <FormField label="Current working place" name="currentWorkingPlace">
                <Input
                  id="currentWorkingPlace"
                  name="currentWorkingPlace"
                  required
                  minLength={2}
                  maxLength={50}
                  defaultValue={doctor.currentWorkingPlace}
                />
              </FormField>
              <FormField label="Designation" name="designation">
                <Input
                  id="designation"
                  name="designation"
                  required
                  minLength={2}
                  maxLength={50}
                  defaultValue={doctor.designation}
                />
              </FormField>
              <FormField label="Address" name="address" className="sm:col-span-2">
                <textarea
                  id="address"
                  name="address"
                  minLength={10}
                  maxLength={100}
                  rows={2}
                  defaultValue={doctor.address ?? ""}
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
                  updateDoctorMutation.isPending ||
                  specialtiesQuery.isPending ||
                  specialtiesQuery.isError
                }
              >
                {updateDoctorMutation.isPending ? "Updating..." : "Update doctor"}
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

export default UpdateDoctorDialog
