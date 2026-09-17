import z from "zod";

export const zodloginSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export type ILogInpayload = z.infer<typeof zodloginSchema>;