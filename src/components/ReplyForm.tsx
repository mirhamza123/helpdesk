"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { messageSchema } from "@/lib/validators";
import { api, uploadFiles, validateFiles } from "@/lib/client";
import { AttachmentPicker } from "./AttachmentPicker";

export function ReplyForm({ ticketId, isStaff }: { ticketId: string; isStaff: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = messageSchema.safeParse({ body, internal, attachments: [] });
    const fileErr = validateFiles(files);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (fileErr) return toast.error(fileErr);
    setBusy(true);
    try {
      const up = await uploadFiles(files);
      if (up.error) return toast.error(up.error);
      const res = await api(`/api/tickets/${ticketId}/messages`, "POST", { ...parsed.data, attachments: up.urls });
      if (!res.ok) return toast.error(res.error);
      setBody(""); setFiles([]); setInternal(false);
      toast.success(internal ? "Internal note added." : "Reply sent.");
      router.refresh();
    } catch {
      toast.error("Unable to send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`panel space-y-3 p-4 ${internal ? "border-amber-300 bg-amber-50" : ""}`}>
      <label htmlFor="reply" className="label">{internal ? "Internal note (hidden from the requester)" : "Reply"}</label>
      <textarea id="reply" rows={4} className="input" value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
      <AttachmentPicker files={files} onChange={setFiles} disabled={busy} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isStaff ? (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>
        ) : <span />}
        <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : internal ? "Add note" : "Send reply"}</button>
      </div>
    </form>
  );
}
