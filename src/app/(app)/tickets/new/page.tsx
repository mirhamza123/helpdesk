import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/guard";
import { listCategories } from "@/lib/tickets/queries";
import { TicketForm } from "@/components/TicketForm";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "New ticket" };

export default async function NewTicketPage() {
  await requirePageUser(["user"]);
  const categories = await listCategories();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Open a ticket" />
      {categories.length === 0 ? (
        <div className="panel"><EmptyState title="Ticketing isn't set up yet" hint="An admin needs to create at least one category first." action={<Link href="/tickets" className="btn-secondary">Back to tickets</Link>} /></div>
      ) : <TicketForm categories={categories} />}
    </div>
  );
}
