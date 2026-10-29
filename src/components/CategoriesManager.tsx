"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRIORITIES, type Priority } from "@/lib/constants";
import { categorySchema } from "@/lib/validators";
import { api } from "@/lib/client";
import { Alert, EmptyState, PriorityBadge } from "./ui";

type Cat = { id: string; name: string; description: string; defaultPriority: Priority };

export function CategoriesManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = categorySchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    const res = id ? await api(`/api/categories/${id}`, "PATCH", parsed.data) : await api("/api/categories", "POST", parsed.data);
    if (!res.ok) return setError(res.error);
    form.reset(); setEditing(null); router.refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await api(`/api/categories/${id}`, "DELETE");
    if (!res.ok) setError(res.error);
    router.refresh();
  }
  const fields = (c?: Cat) => (
    <>
      <input name="name" defaultValue={c?.name} placeholder="Name" aria-label="Name" className="input" />
      <input name="description" defaultValue={c?.description} placeholder="Description" aria-label="Description" className="input" />
      <select name="defaultPriority" defaultValue={c?.defaultPriority ?? "Medium"} aria-label="Default priority" className="input">{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
    </>
  );
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => save(e)} className="panel grid gap-3 p-4 sm:grid-cols-4">{fields()}<button className="btn-primary">Add category</button></form>
      {error && <Alert>{error}</Alert>}
      <div className="panel divide-y divide-ink-100">
        {categories.length === 0 ? <EmptyState title="No categories yet" hint="Add one above so users can file tickets." /> : categories.map((c) =>
          editing === c.id ? (
            <form key={c.id} onSubmit={(e) => save(e, c.id)} className="grid gap-3 p-4 sm:grid-cols-5">{fields(c)}
              <button className="btn-primary">Save</button><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button></form>
          ) : (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="font-medium">{c.name}</p><p className="truncate text-sm text-ink-500">{c.description || "No description"}</p></div>
              <PriorityBadge priority={c.defaultPriority} />
              <button className="btn-secondary !py-1" onClick={() => setEditing(c.id)}>Edit</button>
              <button className="btn-secondary !py-1 text-red-700" onClick={() => remove(c.id)}>Delete</button>
            </div>
          ))}
      </div>
    </div>
  );
}
