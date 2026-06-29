import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["ADMIN", "VENDOR"]),
  vendorId: z.string().optional(), // required when role === VENDOR, checked in service layer
});

export const updateAccountStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const updateAccountRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "VENDOR"]),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(), // if omitted, a random temp password is generated
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "VENDOR"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
