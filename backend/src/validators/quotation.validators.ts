import { z } from "zod";

export const createQuotationRequestSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(5000),
  dueDate: z.coerce.date().optional(),
  vendorIds: z.array(z.string()).min(1, "Assign at least one vendor"),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "CANCELLED"]).optional(),
});

export const updateQuotationRequestSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(5).max(5000).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "CANCELLED"]).optional(),
});

export const assignVendorsSchema = z.object({
  vendorIds: z.array(z.string()).min(1),
});

export const submitQuotationSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(5000),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().length(3).default("USD"),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]),
  internalNotes: z.string().max(2000).optional(),
});

export const quotationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: z.enum(["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  vendorId: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(["amount", "submissionDate", "createdAt", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateQuotationRequestInput = z.infer<typeof createQuotationRequestSchema>;
export type SubmitQuotationInput = z.infer<typeof submitQuotationSchema>;
