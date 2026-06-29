"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea, Select, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useCreateVendor, useUpdateVendor } from "@/hooks/useVendors";
import { Vendor } from "@/types";

const schema = z.object({
  vendorName: z.string().min(2, "Required"),
  companyName: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  contactNumber: z.string().min(6, "Required"),
  businessAddress: z.string().min(5, "Required"),
  category: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLACKLISTED"]),
});
type FormValues = z.infer<typeof schema>;

export function VendorFormDialog({ open, vendor, onClose }: { open: boolean; vendor: Vendor | null; onClose: () => void }) {
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const isEdit = Boolean(vendor);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PENDING" },
  });

  useEffect(() => {
    if (vendor) {
      reset({
        vendorName: vendor.vendorName,
        companyName: vendor.companyName,
        email: vendor.email,
        contactNumber: vendor.contactNumber,
        businessAddress: vendor.businessAddress,
        category: vendor.category ?? "",
        status: vendor.status,
      });
    } else {
      reset({ vendorName: "", companyName: "", email: "", contactNumber: "", businessAddress: "", category: "", status: "PENDING" });
    }
  }, [vendor, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isEdit && vendor) {
      await updateVendor.mutateAsync({ id: vendor.id, payload: values });
    } else {
      await createVendor.mutateAsync(values);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit Vendor" : "Add New Vendor"} description="Vendor details are used across quotation requests and comparisons." size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="vendorName">Contact Name</Label>
          <Input id="vendorName" {...register("vendorName")} error={errors.vendorName?.message} />
        </div>
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...register("companyName")} error={errors.companyName?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" {...register("contactNumber")} error={errors.contactNumber?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="businessAddress">Business Address</Label>
          <Textarea id="businessAddress" rows={2} {...register("businessAddress")} error={errors.businessAddress?.message} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="e.g. IT Services, Construction" {...register("category")} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </Select>
        </div>

        <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createVendor.isPending || updateVendor.isPending}>
            {isEdit ? "Save Changes" : "Create Vendor"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
