// "use client";

// import { AnyFieldApi } from "@tanstack/react-form";
// import * as React from "react";

// import {
//   Field,
//   FieldDescription,
//   FieldError,
//   FieldLabel,
// } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";

// type AppFieldProps = Omit<
//   React.ComponentProps<typeof Input>,
//   "id" | "name" | "value" | "onBlur" | "onChange"
// > & {
//   field: AnyFieldApi;
//   label: React.ReactNode;
//   description?: React.ReactNode;
//   prepend?: React.ReactNode;
//   append?: React.ReactNode;
//   id?: string;
// };

// function AppField({
//   field,
//   label,
//   description,
//   prepend,
//   append,
//   id,
//   disabled,
//   className,
//   ...inputProps
// }: AppFieldProps) {
//   const inputId = id ?? field.name;
//   const errorId = `${inputId}-error`;
//   const descriptionId = `${inputId}-description`;
//   const errors = field.state.meta.errors;
//   const hasErrors = field.state.meta.isTouched && errors.length > 0;
//   const describedBy = [
//     description ? descriptionId : undefined,
//     hasErrors ? errorId : undefined,
//   ]
//     .filter(Boolean)
//     .join(" ");

//   return (
//     <Field data-invalid={hasErrors} data-disabled={disabled || undefined}>
//       <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
//       <div className="relative flex items-center">
//         {prepend && (
//           <span className="absolute left-2.5 z-10 text-sm text-muted-foreground">
//             {prepend}
//           </span>
//         )}
//         <Input
//           {...inputProps}
//           className={[
//             prepend ? "pl-9" : undefined,
//             append ? "pr-9" : undefined,
//             className,
//           ]
//             .filter(Boolean)
//             .join(" ")}
//           id={inputId}
//           name={field.name}
//           value={
//             (field.state.value as string | number | readonly string[]) ?? ""
//           }
//           onBlur={field.handleBlur}
//           onChange={(event) => field.handleChange(event.target.value)}
//           disabled={disabled}
//           aria-describedby={describedBy || undefined}
//           aria-invalid={hasErrors || undefined}
//         />
//         {append && (
//           <span className="absolute right-2.5 z-10 text-sm text-muted-foreground">
//             {append}
//           </span>
//         )}
//       </div>
//       {description && (
//         <FieldDescription id={descriptionId}>{description}</FieldDescription>
//       )}
//       {hasErrors && <FieldError id={errorId} errors={errors} />}
//     </Field>
//   );
// }

// export { AppField };
// export type { AppFieldProps };
// export default AppField;


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AnyFieldApi } from "@tanstack/react-form";
import React from "react";

const getErrorMessage = (error : unknown) : string => {
    if (typeof error === "string") return error;

    if(error && typeof error === "object"){
        if("message" in error && typeof error.message === "string"){
            return error.message;
        }
    }

    return String(error);
}

type AppFieldProps = {
    field : AnyFieldApi;
    label : string;
    type ?: "text" | "email" | "password" | "number";
    placeholder ?: string;
    append ?: React.ReactNode;
    prepend ?: React.ReactNode;
    className ?: string;
    disabled ?: boolean;
}

const AppField = ({
    field,
    label,
    type = "text",
    placeholder,
    append,
    prepend,
    className,
    disabled = false,
} : AppFieldProps) => {

    const firstError = field.state.meta.isTouched && field.state.meta.errors.length > 0 ? getErrorMessage(field.state.meta.errors[0]) : null;

    const hasError = firstError !== null;

  return (
    <div className={cn("space-y-1.5", className)}>
        <Label
            htmlFor={field.name}
            className={cn(hasError && "text-destructive")}
        >
            {label}
        </Label>

        <div className="relative">
            {
                prepend && (<div className="absolute inset-y-0 left-0 items-center pl-3 pointer-events-none z-10">
                    {prepend}
                </div>)
            }

            <Input
                id={field.name}
                name={field.name}
                type={type}
                value={field.state.value}
                placeholder={placeholder}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={disabled}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${field.name}-error` : undefined}
                className={cn(
                    prepend && "pl-10",
                    append && "pr-10",
                    hasError && "border-destructive focus-visible:ring-destructive/20",
                )}
            />

            {
                append && (<div className="absolute inset-y-0 right-0 items-center pr-3 pointer-events-none z-10">
                    {append}
                </div>)
            }

            {
                hasError && (
                    <p
                     id={`${field.name}-error`}
                     role="alert"
                     className="text-sm text-destructive" 
                    >
                        {firstError}
                    </p>
                )
            }
        </div>
    </div>
  )
}

export default AppField