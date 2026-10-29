"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Main">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/tickets" && path.startsWith(l.href)) || (l.href === "/tickets" && path.startsWith("/tickets") && !path.startsWith("/tickets/new"));
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-brand-100 text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
