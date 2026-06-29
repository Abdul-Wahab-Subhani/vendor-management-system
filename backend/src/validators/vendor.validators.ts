import { z } from "zod";

export const createVendorSchema = z.object({
  vendorName: z.string().min(2).max(150),
  companyName: z.string().min(2).max(150),
  email: z.string().email(),
  contactNumber: z.string().min(6).max(30),
  businessAddress: z.string().min(5).max(500),
  category: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLACKLISTED"]).optional(),
  createVendorAccount: z.boolean().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLACKLISTED"]).optional(),
  category: z.string().optional(),
  sortBy: z.enum(["vendorName", "companyName", "registrationDate", "rating", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const addVendorNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
