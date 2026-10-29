"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRIORITIES, STATUSES, type Priority, type Role, type Status } from "@/lib/constants";
import { api } from "@/lib/client";
import { Alert } from "./ui";

export function TicketControls({ ticketId, role, status, priority, assignedAgentId, agents }: {
  ticketId: string; role: Role; status: Status; priority: Priority; assignedAgentId: string | null; agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => ReturnType<typeof api>) {
    setBusy(true); setError("");
    const res = await fn();
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }
  const patch = (body: object) => run(() => api(`/api/tickets/${ticketId}`, "PATCH", body));

  if (role === "user") {
    if (status === "Closed") return null;
    return (
      <div className="space-y-2">
        {error && <Alert>{error}</Alert>}
        <button className="btn-secondary w-full" disabled={busy}
          onClick={() => confirm("Close this ticket? You won't be able to reply afterwards.") && patch({ status: "Closed" })}>
          Close ticket
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <div><label className="label" htmlFor="st">Status</label>
        <select id="st" className="input" value={status} disabled={busy} onChange={(e) => patch({ status: e.target.value })}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      {role === "admin" && (
        <>
          <div><label className="label" htmlFor="pr">Priority</label>
            <select id="pr" className="input" value={priority} disabled={busy} onChange={(e) => patch({ priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="label" htmlFor="ag">Assigned agent</label>
            <select id="ag" className="input" value={assignedAgentId ?? ""} disabled={busy}
              onChange={(e) => run(() => api(`/api/tickets/${ticketId}/assign`, "POST", { agentId: e.target.value || null }))}>
              <option value="">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        </>
      )}
    </div>
  );
}
