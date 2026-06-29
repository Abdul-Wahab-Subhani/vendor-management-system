"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Mail, Phone, MapPin, Calendar, FileText, StickyNote, Upload, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Form";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { VendorFormDialog } from "@/components/vendors/VendorFormDialog";
import { useVendor, useAddVendorNote, useUploadVendorDocument } from "@/hooks/useVendors";
import { useQuotations } from "@/hooks/useQuotations";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useRef } from "react";

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(params.id);
  const { data: quotations } = useQuotations({ vendorId: params.id, limit: 50 });
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const addNote = useAddVendorNote();
  const uploadDoc = useUploadVendorDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading || !vendor) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/vendors")} className="flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-ink dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </button>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gold-400" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <Avatar name={vendor.companyName} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-ink dark:text-white">{vendor.companyName}</h1>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="mt-0.5 text-sm text-[rgb(var(--fg-muted))]">Contact: {vendor.vendorName}{vendor.category ? ` · ${vendor.category}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[rgb(var(--fg-muted))]">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {vendor.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {vendor.contactNumber}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {vendor.businessAddress}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Registered {formatDate(vendor.registrationDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-gold-50 dark:bg-gold-400/10 px-3 py-1.5 figure text-sm font-semibold text-gold-700 dark:text-gold-300">
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {(vendor.rating ?? 0).toFixed(1)}
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "quotations", label: `Quotations (${quotations?.items.length ?? 0})` },
          { value: "documents", label: `Documents (${vendor.documents?.length ?? 0})` },
          { value: "notes", label: `Notes (${vendor.notes?.length ?? 0})` },
        ]}
        onChange={setTab}
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Recent Quotations</CardTitle></CardHeader>
            <CardContent>
              {!quotations?.items.length ? (
                <EmptyState icon={FileText} title="No quotations yet" description="This vendor hasn't submitted any quotations." />
              ) : (
                <div className="space-y-3">
                  {quotations.items.slice(0, 6).map((q) => (
                    <div key={q.id} className="flex items-center justify-between border-b border-border dark:border-border-dark pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-white">{q.title}</p>
                        <p className="text-xs text-[rgb(var(--fg-muted))]">{formatDate(q.submissionDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="figure text-sm font-semibold">{formatCurrency(Number(q.amount), q.currency)}</span>
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Linked Accounts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!vendor.userAccounts?.length ? (
                <p className="text-sm text-[rgb(var(--fg-muted))]">No portal account created for this vendor yet.</p>
              ) : (
                vendor.userAccounts.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-[rgb(var(--fg-muted))]">{u.email}</p>
                    </div>
                    <StatusBadge status={u.status ?? "ACTIVE"} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "quotations" && (
        <Card>
          <CardContent className="p-0">
            {!quotations?.items.length ? (
              <EmptyState icon={FileText} title="No quotations yet" />
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {quotations.items.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-white">{q.title}</p>
                      <p className="text-xs text-[rgb(var(--fg-muted))]">For: {q.quotationRequest?.title} · Submitted {formatDate(q.submissionDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="figure text-sm font-semibold">{formatCurrency(Number(q.amount), q.currency)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "documents" && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadDoc.mutate({ id: vendor.id, file });
            }} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} isLoading={uploadDoc.isPending}>
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
          </CardHeader>
          <CardContent>
            {!vendor.documents?.length ? (
              <EmptyState icon={FileText} title="No documents uploaded" description="Upload registration certificates, compliance docs, or contracts." />
            ) : (
              <div className="space-y-2">
                {vendor.documents.map((doc) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <span className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-navy-700 dark:text-gold-400" /> {doc.fileName}</span>
                    <span className="text-xs text-[rgb(var(--fg-muted))]">{formatDate(doc.createdAt)}</span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "notes" && (
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add an internal note about this vendor..."
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  if (!noteText.trim()) return;
                  await addNote.mutateAsync({ id: vendor.id, content: noteText });
                  setNoteText("");
                }}
                isLoading={addNote.isPending}
              >
                <StickyNote className="h-4 w-4" /> Add
              </Button>
            </div>
            {!vendor.notes?.length ? (
              <EmptyState icon={StickyNote} title="No notes yet" />
            ) : (
              <div className="space-y-3">
                {vendor.notes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border dark:border-border-dark p-3">
                    <p className="text-sm text-ink dark:text-white">{n.content}</p>
                    <p className="mt-1.5 text-xs text-[rgb(var(--fg-muted))]">{n.author.name} · {formatDate(n.createdAt, true)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <VendorFormDialog open={editOpen} vendor={vendor} onClose={() => setEditOpen(false)} />
    </div>
  );
}
