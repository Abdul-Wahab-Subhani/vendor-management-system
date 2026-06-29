"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useCreateAccount, useVendorOptions } from "@/hooks/useAdmin";
import { Vendor } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "VENDOR"]),
  vendorId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AccountFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAccount = useCreateAccount();
  const { data: vendors } = useVendorOptions();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "ADMIN" } });

  const role = watch("role");

  const onSubmit = async (values: FormValues) => {
    await createAccount.mutateAsync(values);
    reset({ name: "", email: "", role: "ADMIN", vendorId: "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Account" description="A temporary password will be generated and emailed automatically." size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" {...register("role")}>
            <option value="ADMIN">Admin</option>
            <option value="VENDOR">Vendor</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register("name")} error={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} error={errors.email?.message} />
        </div>
        {role === "VENDOR" && (
          <div>
            <Label htmlFor="vendorId">Linked Vendor Company</Label>
            <Select id="vendorId" {...register("vendorId")}>
              <option value="">Select a vendor...</option>
              {(vendors as Vendor[] | undefined)?.map((v) => (
                <option key={v.id} value={v.id}>{v.companyName}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createAccount.isPending}>Create Account</Button>
        </div>
      </form>
    </Dialog>
  );
}
