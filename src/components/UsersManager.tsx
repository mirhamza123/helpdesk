"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, type Role } from "@/lib/constants";
import { adminUserCreateSchema } from "@/lib/validators";
import { api } from "@/lib/client";
import type { UserRow } from "@/lib/users";
import { formatDate } from "@/lib/utils";
import { Alert, EmptyState } from "./ui";

export function UsersManager({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = adminUserCreateSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return setErrors(parsed.error.flatten().fieldErrors);
    setErrors({}); setError(""); setBusy(true);
    const res = await api("/api/admin/users", "POST", parsed.data);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    form.reset(); router.refresh();
  }
  async function update(id: string, body: object) {
    setError("");
    const res = await api(`/api/admin/users/${id}`, "PATCH", body);
    if (!res.ok) setError(res.error);
    router.refresh();
  }
  const e = (k: string) => errors[k]?.[0] && <p className="field-error">{errors[k][0]}</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" noValidate>
        <div><label className="label" htmlFor="n">Name</label><input id="n" name="name" className="input" />{e("name")}</div>
        <div><label className="label" htmlFor="em">Email</label><input id="em" name="email" type="email" className="input" />{e("email")}</div>
        <div><label className="label" htmlFor="pw">Temporary password</label><input id="pw" name="password" type="password" autoComplete="new-password" className="input" />{e("password")}</div>
        <div><label className="label" htmlFor="ro">Role</label><select id="ro" name="role" defaultValue="agent" className="input">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={busy}>Add account</button></div>
      </form>
      {error && <Alert>{error}</Alert>}
      <div className="panel overflow-x-auto">
        {users.length === 0 ? <EmptyState title="No accounts yet" /> : (
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-ink-300/70"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Joined</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => {
                const self = u.id === currentUserId;
                return (
                  <tr key={u.id}>
                    <td className="td font-medium">{u.name}{self && <span className="ml-1 text-xs text-ink-500">(you)</span>}</td>
                    <td className="td">{u.email}</td>
                    <td className="td"><select aria-label={`Role for ${u.name}`} className="input !w-auto !py-1" value={u.role} disabled={self} onChange={(ev) => update(u.id, { role: ev.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
                    <td className="td text-ink-500">{formatDate(u.createdAt)}</td>
                    <td className="td"><button className={u.active ? "btn-secondary !py-1" : "btn-primary !py-1"} disabled={self} onClick={() => update(u.id, { active: !u.active })}>{u.active ? "Deactivate" : "Activate"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
