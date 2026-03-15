"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const appOrigin =
      typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
        : window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appOrigin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-emerald-50/60 dark:from-gray-950 dark:via-slate-950 dark:to-emerald-950/30"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20"
        aria-hidden
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[50vh] w-[50vh] rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-800/20"
        aria-hidden
      />

      <Card className="relative w-full max-w-md border-gray-200/80 bg-white/80 shadow-xl backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-center text-2xl">NoteTrade</CardTitle>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Sign in to your trading journal
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">{error}</Alert>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
