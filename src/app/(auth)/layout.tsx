export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-2xl font-semibold text-brand-700">Helpdesk</p>
        <p className="mb-6 text-sm text-ink-500">Track your support requests and get answers from our team.</p>
        <div className="panel p-6">{children}</div>
      </div>
    </main>
  );
}
