"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRIORITIES, type Priority } from "@/lib/constants";
import { ticketCreateSchema } from "@/lib/validators";
import { api, uploadFiles, validateFiles } from "@/lib/client";
import { AttachmentPicker } from "./AttachmentPicker";
import { Alert } from "./ui";

type Cat = { id: string; name: string; description: string; defaultPriority: Priority };

export function TicketForm({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>(categories[0]?.defaultPriority ?? "Medium");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const input = { title: fd.get("title"), description: fd.get("description"), category, priority, attachments: [] };
    const parsed = ticketCreateSchema.safeParse(input);
    const fileErr = validateFiles(files);
    if (!parsed.success || fileErr) {
      setErrors({ ...(parsed.success ? {} : parsed.error.flatten().fieldErrors), ...(fileErr ? { attachments: [fileErr] } : {}) });
      return;
    }
    setErrors({});
    setBusy(true);
    const up = await uploadFiles(files);
    if (up.error) { setBusy(false); return setFormError(up.error); }
    const res = await api<{ id: string }>("/api/tickets", "POST", { ...parsed.data, attachments: up.urls });
    setBusy(false);
    if (!res.ok) { setErrors(res.fieldErrors ?? {}); return setFormError(res.error); }
    router.push(`/tickets/${res.data.id}`);
    router.refresh();
  }

  const err = (k: string) => errors[k]?.[0] && <p className="field-error">{errors[k][0]}</p>;
  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5" noValidate>
      {formError && <Alert>{formError}</Alert>}
      <div><label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" maxLength={150} placeholder="Short summary of the problem" />{err("title")}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="category">Category</label>
          <select id="category" className="input" value={category} onChange={(e) => {
            setCategory(e.target.value);
            const c = categories.find((c) => c.id === e.target.value); if (c) setPriority(c.defaultPriority);
          }}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{err("category")}</div>
        <div><label className="label" htmlFor="priority">Priority</label>
          <select id="priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>{err("priority")}</div>
      </div>
      <div><label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={7} maxLength={5000} className="input" placeholder="What happened? What did you expect? Include any error messages." />{err("description")}</div>
      <div><AttachmentPicker files={files} onChange={setFiles} disabled={busy} />{err("attachments")}
        <p className="mt-1 text-xs text-ink-500">PNG, JPG, WEBP, GIF or PDF · max 4 MB each</p></div>
      <button className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit ticket"}</button>
    </form>
  );
}
