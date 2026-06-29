export type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type VendorStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BLACKLISTED";
export type QuotationRequestStatus = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
export type QuotationStatus = "PENDING" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "QUOTATION" | "VENDOR" | "SYSTEM";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: AccountStatus;
  vendorId: string | null;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  vendor?: { id: string; companyName: string } | null;
}

export interface Vendor {
  id: string;
  vendorName: string;
  companyName: string;
  email: string;
  contactNumber: string;
  businessAddress: string;
  registrationDate: string;
  status: VendorStatus;
  rating: number | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { quotations: number; documents: number };
  notes?: VendorNote[];
  documents?: VendorDocument[];
  userAccounts?: User[];
}

export interface VendorNote {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface VendorDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  createdAt: string;
}

export interface QuotationRequest {
  id: string;
  title: string;
  description: string;
  status: QuotationRequestStatus;
  dueDate: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string; email?: string };
  assignedVendors?: { id: string; status: string; vendor: { id: string; companyName: string }; assignedAt: string }[];
  quotations?: Quotation[];
  _count?: { quotations: number };
}

export interface Quotation {
  id: string;
  quotationRequestId: string;
  title: string;
  description: string;
  amount: string | number;
  currency: string;
  submissionDate: string | null;
  status: QuotationStatus;
  internalNotes?: string | null;
  createdAt: string;
  vendor: { id: string; companyName: string; vendorName: string; rating: number | null; email?: string };
  quotationRequest?: { id: string; title: string };
  attachments?: { id: string; fileName: string; fileUrl: string }[];
  reviewedBy?: { id: string; name: string } | null;
}

export interface ComparisonRow {
  quotationId: string;
  vendorId: string;
  vendorName: string;
  companyName: string;
  vendorRating: number;
  title: string;
  amount: number;
  currency: string;
  submissionDate: string | null;
  status: string;
  isLowestPrice: boolean;
  isBestValue: boolean;
  valueScore: number;
}

export interface ComparisonResult {
  requestId: string;
  requestTitle: string;
  rows: ComparisonRow[];
  summary: {
    vendorCount: number;
    lowestPrice: { vendor: string; amount: number; currency: string };
    bestValue: { vendor: string; amount: number; currency: string };
    averageAmount: number;
    potentialSavings: number;
  };
  recommendation: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
  user?: { id: string; name: string; email?: string; role?: Role } | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}
