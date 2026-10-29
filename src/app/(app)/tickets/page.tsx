import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/guard";
import { parseListQuery } from "@/lib/validators";
import { listAgents, listCategories, listTickets } from "@/lib/tickets/queries";
import { formatDate } from "@/lib/utils";
import { TicketFilters } from "@/components/TicketFilters";
import { Pagination } from "@/components/Pagination";
import { SlaTimer } from "@/components/SlaTimer";
import { EmptyState, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePageUser();
  const query = parseListQuery(await searchParams);
  const isStaff = user.role !== "user";
  const [data, categories, agents] = await Promise.all([
    listTickets(user, query), listCategories(), user.role === "admin" ? listAgents() : Promise.resolve(undefined),
  ]);
  const filtered = !!(query.q || query.status || query.priority || query.category || query.assigned);
  const title = user.role === "user" ? "My tickets" : user.role === "agent" ? "My queue" : "All tickets";

  return (
    <>
      <PageHeader title={title}>
        {user.role === "user" && <Link href="/tickets/new" className="btn-primary">New ticket</Link>}
      </PageHeader>
      <div className="panel overflow-hidden">
        <TicketFilters current={query} categories={categories} agents={agents} />
        {data.items.length === 0 ? (
          <EmptyState
            title={filtered ? "No tickets match these filters" : user.role === "user" ? "You haven't opened any tickets" : user.role === "agent" ? "Nothing assigned to you yet" : "No tickets yet"}
            hint={filtered ? "Try clearing a filter or searching for something else." : user.role === "user" ? "Open a ticket and our team will get back to you." : undefined}
            action={filtered ? <Link href="/tickets" className="btn-secondary">Clear filters</Link> : user.role === "user" ? <Link href="/tickets/new" className="btn-primary">Open a ticket</Link> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink-300/70 bg-ink-50">
                <tr><th className="th">Ticket</th><th className="th">Category</th><th className="th">Priority</th><th className="th">Status</th>
                  {isStaff && <th className="th">Requester</th>}{user.role === "admin" && <th className="th">Agent</th>}<th className="th">SLA</th><th className="th">Created</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-50">
                    <td className="td"><Link href={`/tickets/${t.id}`} className="font-medium text-brand-700 hover:underline">{t.ticketNumber}</Link>
                      <p className="max-w-xs truncate">{t.title}</p></td>
                    <td className="td">{t.category}</td>
                    <td className="td"><PriorityBadge priority={t.priority} /></td>
                    <td className="td"><StatusBadge status={t.status} /></td>
                    {isStaff && <td className="td">{t.createdBy}</td>}
                    {user.role === "admin" && <td className="td">{t.assignedAgent ?? <span className="text-ink-500">Unassigned</span>}</td>}
                    <td className="td"><SlaTimer sla={t} compact /></td>
                    <td className="td whitespace-nowrap text-ink-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total}
          params={{ q: query.q, status: query.status, priority: query.priority, category: query.category, assigned: query.assigned }} />}
      </div>
    </>
  );
}
