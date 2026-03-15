import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="text-[10rem] leading-none select-none" aria-hidden>
        👎
      </div>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-center text-gray-400">
        This page doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
      >
        Go home
      </Link>
    </div>
  );
}
