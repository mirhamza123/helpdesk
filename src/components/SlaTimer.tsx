"use client";
import { useEffect, useState } from "react";
import type { SlaFields } from "@/lib/types";

function fmt(ms: number) {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  const body = d ? `${d}d ${h}h` : h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
  return ms < 0 ? `${body} overdue` : `${body} left`;
}

export function SlaTimer({ sla, compact = false }: { sla: SlaFields; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null); // null on first render avoids hydration mismatch
  const finished = sla.status === "Resolved" || sla.status === "Closed";

  useEffect(() => {
    if (finished) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished]);

  const breachBadge = <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">SLA Breached</span>;
  if (finished) return sla.slaBreached ? breachBadge : <span className="text-xs text-ink-500">Completed within SLA</span>;
  if (now === null) return <span className="text-xs text-ink-500">…</span>;

  const rows = [
    ...(!sla.firstResponseAt ? [{ label: "Response", ms: new Date(sla.responseDueDate).getTime() - now }] : []),
    { label: "Resolution", ms: new Date(sla.resolutionDueDate).getTime() - now },
  ];
  const breached = sla.slaBreached || rows.some((r) => r.ms < 0);
  const shown = compact ? rows.slice(0, 1).map((r) => (rows.length > 1 && rows[1].ms < r.ms ? rows[1] : r)) : rows;

  return (
    <div className="space-y-1">
      {breached && breachBadge}
      {shown.map((r) => (
        <div key={r.label} className={`text-xs tabular-nums ${r.ms < 0 ? "font-medium text-red-600" : r.ms < 3_600_000 ? "font-medium text-amber-600" : "text-ink-700"}`}>
          {r.label}: {fmt(r.ms)}
        </div>
      ))}
    </div>
  );
}
