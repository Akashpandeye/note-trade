import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="font-semibold text-gray-900 dark:text-white">
            NoteTrade
          </Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Dashboard</Link>
            <Link href="/trades" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Trades</Link>
            <Link href="/upload" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Upload</Link>
            <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Analytics</Link>
            <form action="/auth/signout" method="post" className="inline">
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
