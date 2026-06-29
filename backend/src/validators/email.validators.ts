import { z } from "zod";

export const sendEmailSchema = z.object({
  recipientType: z.enum(["SINGLE_VENDOR", "MULTIPLE_VENDORS", "ALL_VENDORS", "ALL_ADMINS"]),
  vendorIds: z.array(z.string()).optional(), // required for SINGLE_VENDOR / MULTIPLE_VENDORS
  subject: z.string().min(2).max(200),
  bodyHtml: z.string().min(2),
  scheduledFor: z.coerce.date().optional(),
});

export const createTemplateSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores only"),
  name: z.string().min(2).max(100),
  subject: z.string().min(2).max(200),
  htmlBody: z.string().min(2),
  variables: z.array(z.string()).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial().omit({ key: true });

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
