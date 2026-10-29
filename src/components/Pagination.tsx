import Link from "next/link";

export function Pagination({ page, pages, total, params = {}, param = "page" }: {
  page: number; pages: number; total: number; params?: Record<string, string | undefined>; param?: string;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set(param, String(p));
    return `?${sp.toString()}`;
  };
  const link = "btn-secondary !px-3 !py-1.5";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-ink-300/70 px-4 py-3 text-sm">
      <span className="text-ink-500">{total} total · Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className={link} href={href(page - 1)}>Previous</Link> : <span className={`${link} opacity-50`}>Previous</span>}
        {page < pages ? <Link className={link} href={href(page + 1)}>Next</Link> : <span className={`${link} opacity-50`}>Next</span>}
      </div>
    </nav>
  );
}
