import Link from "next/link";
import Image from "next/image";
import { IndexMarquee } from "@/components/layout/IndexMarquee";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-gray-950">
      {/* Landing-style background glow behind app content */}
      <div className="pointer-events-none absolute inset-0">
        {/* Light-mode glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(56,189,248,0.16),transparent)] dark:hidden" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.85)_0%,rgba(241,245,249,0.95)_70%)] dark:hidden" />
        {/* Light-mode dark starry overlay */}
        <div
          className="absolute inset-0 dark:hidden"
          aria-hidden
          style={{
            backgroundImage: [
              // large soft navy glows
              "radial-gradient(circle at 15% 20%, rgba(15,23,42,0.45) 0, transparent 55%)",
              "radial-gradient(circle at 80% 15%, rgba(15,23,42,0.38) 0, transparent 55%)",
              "radial-gradient(circle at 20% 85%, rgba(15,23,42,0.32) 0, transparent 60%)",
              // dense tiny dark dots = stars
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.55) 1px, transparent 0)",
            ].join(", "),
            backgroundSize: "auto, auto, auto, 26px 26px",
            opacity: 0.5,
          }}
        />
        {/* Dark-mode glow (matches landing) */}
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(22,163,74,0.18),transparent)] dark:block" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.6)_70%)] dark:block" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2394a3b8\' fill-opacity=\'0.6\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="note-trade" width={40} height={40} className="h-8 w-auto" priority />
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
              note<span className="text-emerald-400">trade</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Dashboard</Link>
              <Link href="/book" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Book</Link>
              <Link href="/trades" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Trades</Link>
              <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Analytics</Link>
              <form action="/auth/signout" method="post" className="inline">
                <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Sign out</button>
              </form>
            </nav>
          </div>
        </div>
      </header>
      <IndexMarquee />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
