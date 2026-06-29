"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea, Label, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useSubmitQuotation } from "@/hooks/useQuotations";
import { QuotationRequest } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Required"),
  description: z.string().min(5, "Required"),
  amount: z.coerce.number().positive("Must be greater than zero"),
  currency: z.string().min(3).max(3),
});
type FormValues = z.infer<typeof schema>;

export function SubmitQuotationDialog({ request, onClose }: { request: QuotationRequest | null; onClose: () => void }) {
  const submitQuotation = useSubmitQuotation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currency: "USD" } });

  const onSubmit = async (values: FormValues) => {
    if (!request) return;
    await submitQuotation.mutateAsync({ requestId: request.id, payload: values });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={Boolean(request)}
      onClose={() => { reset(); onClose(); }}
      title="Submit Quotation"
      description={request ? `For: "${request.title}"` : ""}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Quotation Title</Label>
          <Input id="title" placeholder="e.g. Proposal for office furniture supply" {...register("title")} error={errors.title?.message} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} placeholder="Outline your proposal, scope, and terms..." {...register("description")} error={errors.description?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register("amount")} error={errors.amount?.message} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" {...register("currency")}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="PKR">PKR</option>
              <option value="INR">INR</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" isLoading={submitQuotation.isPending}>Submit Quotation</Button>
        </div>
      </form>
    </Dialog>
  );
}
