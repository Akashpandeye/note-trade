import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(22,163,74,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt="note-trade"
            width={56}
            height={56}
            className="h-12 w-auto"
            priority
          />
          <span className="hidden text-lg font-semibold tracking-tight text-white sm:inline">
            note<span className="text-emerald-400">trade</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-gray-600 bg-gray-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-gray-500 hover:bg-gray-800/80"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 pb-20 pt-10 text-center sm:px-8">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-green-400">
          Trading journal
        </p>
        <h1 className="font-syne max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Log trades.
          <br />
          <span className="text-green-400">See what works.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-400 sm:text-xl">
          Upload your Zerodha tradebook, track P&L, and learn from every trade with a clean dashboard and analytics.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-green-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-500/25 transition hover:bg-green-400 hover:shadow-green-500/30"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-gray-600 bg-gray-900/40 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:border-gray-500 hover:bg-gray-800/60"
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-20 flex flex-wrap justify-center gap-3">
          {["Zerodha CSV", "P&L & equity curve", "Win rate & streaks", "Dark mode"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm text-gray-300"
            >
              {label}
            </span>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-gray-800/80 px-6 py-6 text-center text-sm text-gray-500 sm:px-8">
        NoteTrade — Track, learn, improve.
      </footer>
    </div>
  );
}
