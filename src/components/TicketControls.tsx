"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { PRIORITIES, STATUSES, type Priority, type Role, type Status } from "@/lib/constants";
import { api } from "@/lib/client";

export function TicketControls({ ticketId, role, status, priority, assignedAgentId, agents }: {
  ticketId: string; role: Role; status: Status; priority: Priority; assignedAgentId: string | null; agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => ReturnType<typeof api>, successMessage: string) {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.ok) return toast.error(res.error);
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Unable to update this ticket. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const patch = (body: object, successMessage: string) => run(() => api(`/api/tickets/${ticketId}`, "PATCH", body), successMessage);

  if (role === "user") {
    if (status === "Closed") return null;
    return (
      <div className="space-y-2">
        <button className="btn-secondary w-full" disabled={busy}
          onClick={() => confirm("Close this ticket? You won't be able to reply afterwards.") && patch({ status: "Closed" }, "Ticket closed.")}>
          Close ticket
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div><label className="label" htmlFor="st">Status</label>
        <select id="st" className="input" value={status} disabled={busy} onChange={(e) => patch({ status: e.target.value }, "Ticket status updated.")}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      {role === "admin" && (
        <>
          <div><label className="label" htmlFor="pr">Priority</label>
            <select id="pr" className="input" value={priority} disabled={busy} onChange={(e) => patch({ priority: e.target.value }, "Ticket priority updated.")}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="label" htmlFor="ag">Assigned agent</label>
            <select id="ag" className="input" value={assignedAgentId ?? ""} disabled={busy}
              onChange={(e) => run(() => api(`/api/tickets/${ticketId}/assign`, "POST", { agentId: e.target.value || null }), e.target.value ? "Agent assigned." : "Ticket unassigned.")}>
              <option value="">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        </>
      )}
    </div>
  );
}
