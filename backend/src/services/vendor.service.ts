import { Prisma, VendorStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { NotFoundError, ConflictError } from "../utils/errors";
import { ActivityLogService, ActivityActions } from "./activityLog.service";
import { CreateVendorInput, UpdateVendorInput } from "../validators/vendor.validators";

interface VendorListParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: VendorStatus;
  category?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const VendorService = {
  async list(params: VendorListParams) {
    const where: Prisma.VendorWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? {
            OR: [
              { vendorName: { contains: params.search, mode: "insensitive" } },
              { companyName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const sortField = params.sortBy ?? "createdAt";
    const sortDirection = params.sortOrder ?? "desc";
    const orderBy: Prisma.VendorOrderByWithRelationInput =
      sortField === "vendorName"
        ? { vendorName: sortDirection }
        : sortField === "companyName"
        ? { companyName: sortDirection }
        : sortField === "registrationDate"
        ? { registrationDate: sortDirection }
        : sortField === "rating"
        ? { rating: sortDirection }
        : sortField === "status"
        ? { status: sortDirection }
        : { createdAt: sortDirection };

    const [items, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          _count: { select: { quotations: true, documents: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return { items, total };
  },

  async getById(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } },
        documents: { orderBy: { createdAt: "desc" } },
        userAccounts: { select: { id: true, name: true, email: true, status: true, lastLoginAt: true } },
        _count: { select: { quotations: true } },
      },
    });
    if (!vendor) throw new NotFoundError("Vendor not found");
    return vendor;
  },

  async create(input: CreateVendorInput, actor: { id: string; name: string }) {
    const existing = await prisma.vendor.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("A vendor with this email already exists");

    const vendor = await prisma.vendor.create({
      data: {
        vendorName: input.vendorName,
        companyName: input.companyName,
        email: input.email,
        contactNumber: input.contactNumber,
        businessAddress: input.businessAddress,
        category: input.category,
        status: input.status ?? "PENDING",
        createdById: actor.id,
      },
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.VENDOR_CREATED,
      entityType: "Vendor",
      entityId: vendor.id,
      description: `${actor.name} added vendor "${vendor.companyName}"`,
    });

    return vendor;
  },

  async update(id: string, input: UpdateVendorInput, actor: { id: string; name: string }) {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundError("Vendor not found");

    const updated = await prisma.vendor.update({ where: { id }, data: input });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.VENDOR_UPDATED,
      entityType: "Vendor",
      entityId: id,
      description: `${actor.name} updated vendor "${vendor.companyName}"`,
      metadata: { changes: input },
    });

    return updated;
  },

  async updateStatus(id: string, status: VendorStatus, actor: { id: string; name: string }) {
    const vendor = await prisma.vendor.update({ where: { id }, data: { status } });
    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.VENDOR_STATUS_CHANGED,
      entityType: "Vendor",
      entityId: id,
      description: `${actor.name} set "${vendor.companyName}" status to ${status}`,
    });
    return vendor;
  },

  async delete(id: string, actor: { id: string; name: string }) {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundError("Vendor not found");

    await prisma.vendor.delete({ where: { id } });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.VENDOR_DELETED,
      entityType: "Vendor",
      entityId: id,
      description: `${actor.name} deleted vendor "${vendor.companyName}"`,
    });
  },

  async addNote(vendorId: string, content: string, author: { id: string; name: string }) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundError("Vendor not found");

    const note = await prisma.vendorNote.create({
      data: { vendorId, content, authorId: author.id },
      include: { author: { select: { id: true, name: true } } },
    });

    await ActivityLogService.log({
      userId: author.id,
      action: ActivityActions.VENDOR_NOTE_ADDED,
      entityType: "Vendor",
      entityId: vendorId,
      description: `${author.name} added a note to "${vendor.companyName}"`,
    });

    return note;
  },

  async addDocument(
    vendorId: string,
    doc: { fileName: string; fileUrl: string; fileType: string; fileSize?: number },
    uploader: { id: string; name: string }
  ) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundError("Vendor not found");

    const document = await prisma.vendorDocument.create({
      data: { vendorId, ...doc, uploadedById: uploader.id },
    });

    await ActivityLogService.log({
      userId: uploader.id,
      action: ActivityActions.VENDOR_DOCUMENT_UPLOADED,
      entityType: "Vendor",
      entityId: vendorId,
      description: `${uploader.name} uploaded "${doc.fileName}" to "${vendor.companyName}"`,
    });

    return document;
  },

  async activityHistory(vendorId: string, params: { page: number; limit: number; skip: number }) {
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { entityType: "Vendor", entityId: vendorId },
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.activityLog.count({ where: { entityType: "Vendor", entityId: vendorId } }),
    ]);
    return { items, total };
  },

  async stats() {
    const [total, active, inactive, pending, blacklisted] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.vendor.count({ where: { status: "INACTIVE" } }),
      prisma.vendor.count({ where: { status: "PENDING" } }),
      prisma.vendor.count({ where: { status: "BLACKLISTED" } }),
    ]);
    return { total, active, inactive, pending, blacklisted };
  },
};
