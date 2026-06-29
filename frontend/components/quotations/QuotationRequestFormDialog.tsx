"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useCreateQuotationRequest } from "@/hooks/useQuotations";
import { useVendors } from "@/hooks/useVendors";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Required"),
  description: z.string().min(5, "Required"),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function QuotationRequestFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const createRequest = useCreateQuotationRequest();
  const { data: vendorsResult } = useVendors({ limit: 100, status: "ACTIVE" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const toggleVendor = (id: string) =>
    setSelectedVendors((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const onSubmit = async (values: FormValues) => {
    if (selectedVendors.length === 0) return;
    await createRequest.mutateAsync({ ...values, vendorIds: selectedVendors });
    reset();
    setSelectedVendors([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New Quotation Request"
      description="Vendors you assign will be notified by email and in-app."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. Office furniture supply — Q3" {...register("title")} error={errors.title?.message} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} placeholder="Describe what you're requesting quotations for..." {...register("description")} error={errors.description?.message} />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
        <div>
          <Label>Assign Vendors</Label>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border dark:border-border-dark p-2 space-y-1">
            {(vendorsResult?.items ?? []).map((v) => (
              <label
                key={v.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
                  selectedVendors.includes(v.id) && "bg-gold-50 dark:bg-gold-400/10"
                )}
              >
                <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} />
                <span className="font-medium">{v.companyName}</span>
                <span className="text-[rgb(var(--fg-muted))]">— {v.vendorName}</span>
              </label>
            ))}
          </div>
          {selectedVendors.length === 0 && <p className="mt-1 text-xs text-danger">Select at least one vendor</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createRequest.isPending}>Create & Notify Vendors</Button>
        </div>
      </form>
    </Dialog>
  );
}
