import { signOut } from "@/auth";
import { requirePageUser } from "@/lib/guard";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const links =
    user.role === "admin"
      ? [{ href: "/admin/analytics", label: "Analytics" }, { href: "/tickets", label: "All tickets" }, { href: "/admin/users", label: "Users" }, { href: "/admin/categories", label: "Categories" }]
      : user.role === "agent"
        ? [{ href: "/tickets", label: "My queue" }]
        : [{ href: "/tickets", label: "My tickets" }, { href: "/tickets/new", label: "New ticket" }];

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-ink-300/70 bg-white p-3 md:min-h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r md:p-4">
        <div className="mb-3 flex items-center justify-between md:mb-6 md:block">
          <p className="text-lg font-semibold text-brand-700">Helpdesk</p>
          <div className="text-right md:mt-3 md:text-left">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs capitalize text-ink-500">{user.role}</p>
          </div>
        </div>
        <Nav links={links} />
        <form className="mt-3 md:mt-6" action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="btn-secondary w-full">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
