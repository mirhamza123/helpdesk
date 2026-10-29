import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/guard";
import { getTicketDetail, listAgents } from "@/lib/tickets/queries";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { MessageThread, Attachments } from "@/components/MessageThread";
import { ReplyForm } from "@/components/ReplyForm";
import { SlaTimer } from "@/components/SlaTimer";
import { TicketControls } from "@/components/TicketControls";
import { PriorityBadge, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ mp?: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  const mp = Number((await searchParams).mp) || undefined;
  const data = await getTicketDetail(user, id, mp);
  if (!data) notFound();
  const { ticket: t, messages, activity } = data;
  const isStaff = user.role !== "user";
  const agents = user.role === "admin" ? await listAgents() : [];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/tickets" className="text-sm text-ink-500 hover:underline">← Back to tickets</Link>
      <div className="mt-2 mb-6">
        <p className="text-sm font-medium text-brand-700">{t.ticketNumber}</p>
        <h1 className="text-xl font-semibold sm:text-2xl">{t.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <section className="panel p-4">
            <p className="mb-1 text-xs text-ink-500">Opened by {t.createdBy.name} on {formatDate(t.createdAt)}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{t.description}</p>
            <Attachments urls={t.attachments} />
          </section>

          <section aria-label="Conversation" className="space-y-3">
            <h2 className="text-sm font-semibold">Conversation</h2>
            <MessageThread messages={messages} />
            {data.messagePages > 1 && (
              <div className="panel overflow-hidden"><Pagination page={data.messagePage} pages={data.messagePages} total={data.totalMessages} param="mp" /></div>
            )}
          </section>

          {t.status === "Closed" ? (
            <p className="panel p-4 text-sm text-ink-500">This ticket is closed.{isStaff ? " Change the status to reopen it." : " Open a new ticket if you still need help."}</p>
          ) : <ReplyForm ticketId={t.id} isStaff={isStaff} />}
        </div>

        <aside className="space-y-5">
          <section className="panel space-y-3 p-4">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-ink-500">Category</dt><dd>{t.category.name}</dd></div>
              <div><dt className="text-xs text-ink-500">Requester</dt><dd>{t.createdBy.name}{isStaff && <span className="block text-xs text-ink-500">{t.createdBy.email}</span>}</dd></div>
              <div><dt className="text-xs text-ink-500">Assigned agent</dt><dd>{t.assignedAgent?.name ?? "Not assigned yet"}</dd></div>
              <div><dt className="text-xs text-ink-500">SLA</dt><dd><SlaTimer sla={t} /></dd></div>
              <div><dt className="text-xs text-ink-500">Last updated</dt><dd>{formatDate(t.updatedAt)}</dd></div>
            </dl>
          </section>

          {(isStaff || t.status !== "Closed") && (
            <section className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">{isStaff ? "Manage" : "Actions"}</h2>
              <TicketControls ticketId={t.id} role={user.role} status={t.status} priority={t.priority} assignedAgentId={t.assignedAgent?.id ?? null} agents={agents} />
            </section>
          )}

          <section className="panel p-4">
            <h2 className="mb-3 text-sm font-semibold">{isStaff ? "Activity log" : "Status history"}</h2>
            {activity.length === 0 ? <p className="text-sm text-ink-500">No activity yet.</p> : (
              <ol className="space-y-3 border-l border-ink-300 pl-3">
                {activity.map((a) => (
                  <li key={a.id} className="text-sm"><p>{a.details}</p><p className="text-xs text-ink-500">{a.actor} · {formatDate(a.createdAt)}</p></li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
