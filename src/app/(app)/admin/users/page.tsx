import type { Metadata } from "next";
import { requirePageUser } from "@/lib/guard";
import { listUsers } from "@/lib/users";
import { UsersManager } from "@/components/UsersManager";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = await requirePageUser(["admin"]);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const data = await listUsers(page);
  return (
    <>
      <PageHeader title="Users & agents" />
      <UsersManager users={data.items} currentUserId={admin.id} />
      <div className="panel mt-4 overflow-hidden"><Pagination page={data.page} pages={data.pages} total={data.total} /></div>
    </>
  );
}
