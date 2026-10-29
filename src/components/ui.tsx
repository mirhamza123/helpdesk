import type { ReactNode } from "react";
import type { Priority, Status } from "@/lib/constants";

const statusStyle: Record<Status, string> = {
  Open: "bg-sky-100 text-sky-800",
  "In Progress": "bg-indigo-100 text-indigo-800",
  "Waiting on User": "bg-amber-100 text-amber-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-ink-100 text-ink-700",
};
const priorityStyle: Record<Priority, string> = {
  Low: "bg-ink-100 text-ink-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
};
const pill = "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";

export const StatusBadge = ({ status }: { status: Status }) => <span className={`${pill} ${statusStyle[status]}`}>{status}</span>;
export const PriorityBadge = ({ priority }: { priority: Priority }) => <span className={`${pill} ${priorityStyle[priority]}`}>{priority}</span>;

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  const c = tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div role="alert" className={`rounded-md border px-3 py-2 text-sm ${c}`}>{children}</div>;
}

export const Spinner = () => (
  <div role="status" aria-label="Loading" className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
);

export const PageHeader = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
    {children}
  </div>
);
