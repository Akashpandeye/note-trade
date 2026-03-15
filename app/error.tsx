"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="text-[10rem] leading-none select-none" aria-hidden>
        👎
      </div>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-center text-gray-400">
        We hit a snag. Try again or head back home.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-600 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-gray-500 hover:bg-gray-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
