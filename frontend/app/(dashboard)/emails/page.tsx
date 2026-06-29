"use client";

import { useState } from "react";
import { Send, Mail, History as HistoryIcon, FileCode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Textarea, Label, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSendEmail, useEmailHistory, useEmailTemplates, useVendorOptions } from "@/hooks/useAdmin";
import { formatDate } from "@/lib/utils";
import { Vendor } from "@/types";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
}
interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
}

export default function EmailsPage() {
  const [tab, setTab] = useState("compose");
  const [recipientType, setRecipientType] = useState("ALL_VENDORS");
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const sendEmail = useSendEmail();
  const { data: vendorsResult } = useVendorOptions();
  const { data: history } = useEmailHistory({ limit: 30 });
  const { data: templates } = useEmailTemplates();

  const handleSend = async () => {
    await sendEmail.mutateAsync({
      recipientType,
      vendorIds: recipientType === "SINGLE_VENDOR" || recipientType === "MULTIPLE_VENDORS" ? vendorIds : undefined,
      subject,
      bodyHtml: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
    });
    setSubject("");
    setBody("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Email System</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Send announcements, broadcasts, and manage email templates.</p>
      </div>

      <Tabs
        tabs={[
          { value: "compose", label: "Compose", icon: <Send className="h-3.5 w-3.5" /> },
          { value: "templates", label: "Templates", icon: <FileCode className="h-3.5 w-3.5" /> },
          { value: "history", label: "History", icon: <HistoryIcon className="h-3.5 w-3.5" /> },
        ]}
        onChange={setTab}
      />

      {tab === "compose" && (
        <Card>
          <CardHeader><CardTitle>Compose Email</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientType">Send To</Label>
              <Select id="recipientType" value={recipientType} onChange={(e) => setRecipientType(e.target.value)}>
                <option value="ALL_VENDORS">All Vendors</option>
                <option value="MULTIPLE_VENDORS">Specific Vendors</option>
                <option value="SINGLE_VENDOR">Single Vendor</option>
                <option value="ALL_ADMINS">All Admins</option>
              </Select>
            </div>

            {(recipientType === "MULTIPLE_VENDORS" || recipientType === "SINGLE_VENDOR") && (
              <div>
                <Label>Select Vendor(s)</Label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border dark:border-border-dark p-2 space-y-1">
                  {(vendorsResult as Vendor[] | undefined)?.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                      <input
                        type={recipientType === "SINGLE_VENDOR" ? "radio" : "checkbox"}
                        name="vendor-pick"
                        checked={vendorIds.includes(v.id)}
                        onChange={() =>
                          setVendorIds(recipientType === "SINGLE_VENDOR" ? [v.id] : vendorIds.includes(v.id) ? vendorIds.filter((id) => id !== v.id) : [...vendorIds, v.id])
                        }
                      />
                      {v.companyName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSend} isLoading={sendEmail.isPending} disabled={!subject || !body}>
                <Send className="h-4 w-4" /> Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "templates" && (
        <Card>
          <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
          <CardContent>
            {!templates?.length ? (
              <EmptyState icon={FileCode} title="No templates yet" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(templates as EmailTemplate[]).map((t) => (
                  <div key={t.id} className="rounded-lg border border-border dark:border-border-dark p-4">
                    <p className="text-sm font-semibold text-ink dark:text-white">{t.name}</p>
                    <p className="mt-0.5 text-xs text-[rgb(var(--fg-muted))]">Key: {t.key}</p>
                    <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{t.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader><CardTitle>Email History</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!history?.items.length ? (
              <EmptyState icon={Mail} title="No emails sent yet" />
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {(history.items as EmailLog[]).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-white">{log.subject}</p>
                      <p className="text-xs text-[rgb(var(--fg-muted))]">To: {log.to} · {formatDate(log.createdAt, true)}</p>
                    </div>
                    <Badge tone={log.status === "SENT" ? "success" : log.status === "FAILED" ? "danger" : "warning"}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
