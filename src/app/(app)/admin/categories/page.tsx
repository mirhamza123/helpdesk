import type { Metadata } from "next";
import { requirePageUser } from "@/lib/guard";
import { listCategories } from "@/lib/tickets/queries";
import { CategoriesManager } from "@/components/CategoriesManager";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePageUser(["admin"]);
  const all = await listCategories();
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number((await searchParams).page) || 1), pages);
  return (
    <>
      <PageHeader title="Categories" />
      <CategoriesManager categories={all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} />
      <div className="panel mt-4 overflow-hidden"><Pagination page={page} pages={pages} total={all.length} /></div>
    </>
  );
}
