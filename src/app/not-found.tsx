import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-ink-500">It may have moved, or you may not have access to it.</p>
        <Link href="/dashboard" className="btn-primary mt-5">Back to dashboard</Link></div>
    </main>
  );
}
