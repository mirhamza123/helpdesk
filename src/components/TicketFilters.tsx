"use client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { PRIORITIES, STATUSES } from "@/lib/constants";
import type { ListQuery } from "@/lib/validators";

export function TicketFilters({ current, categories, agents }: {
  current: ListQuery; categories: { id: string; name: string }[]; agents?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) if (typeof v === "string" && v.trim()) sp.set(k, v.trim());
    router.push(`/tickets${sp.size ? `?${sp}` : ""}`);
  };
  const auto = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  return (
    <form onSubmit={submit} className="grid gap-2 border-b border-ink-300/70 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
      <input name="q" defaultValue={current.q} className="input lg:col-span-2" placeholder="Search by ticket number or title" aria-label="Search tickets" maxLength={100} />
      <select name="status" defaultValue={current.status ?? ""} onChange={auto} className="input" aria-label="Status">
        <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select name="priority" defaultValue={current.priority ?? ""} onChange={auto} className="input" aria-label="Priority">
        <option value="">All priorities</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>
      <select name="category" defaultValue={current.category ?? ""} onChange={auto} className="input" aria-label="Category">
        <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {agents ? (
        <select name="assigned" defaultValue={current.assigned ?? ""} onChange={auto} className="input" aria-label="Assignee">
          <option value="">Any assignee</option><option value="unassigned">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      ) : <button className="btn-primary">Search</button>}
    </form>
  );
}
