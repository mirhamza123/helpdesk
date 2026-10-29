import { formatDate } from "@/lib/utils";
import type { MessageDTO } from "@/lib/types";

export function Attachments({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {urls.map((u, i) => (
        <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="rounded border border-ink-300 px-2 py-1 text-xs text-brand-700 hover:bg-ink-100">Attachment {i + 1}</a></li>
      ))}
    </ul>
  );
}

export function MessageThread({ messages }: { messages: MessageDTO[] }) {
  if (!messages.length) return <p className="px-1 text-sm text-ink-500">No replies yet. An agent will respond as soon as possible.</p>;
  return (
    <ol className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={`rounded-lg border p-4 ${m.internal ? "border-amber-300 bg-amber-50" : m.author.role === "user" ? "border-ink-300/70 bg-white" : "border-brand-100 bg-brand-100/40"}`}>
          <div className="mb-1 flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium">{m.author.name}</span>
            <span className="text-xs text-ink-500">{m.author.role === "user" ? "Requester" : m.author.role === "admin" ? "Admin" : "Agent"}</span>
            {m.internal && <span className="rounded bg-amber-200 px-1.5 text-xs font-medium text-amber-900">Internal note</span>}
            <time className="ml-auto text-xs text-ink-500">{formatDate(m.createdAt)}</time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
          <Attachments urls={m.attachments} />
        </li>
      ))}
    </ol>
  );
}
