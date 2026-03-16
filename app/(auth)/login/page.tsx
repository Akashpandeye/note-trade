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
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Landing-style background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(22,163,74,0.18),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.55)_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
        aria-hidden
      />

      {/* Centered auth card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <Card className="w-full max-w-md border border-gray-800 bg-gray-900/80 shadow-2xl shadow-black/40 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-2xl text-white">NoteTrade</CardTitle>
          <p className="text-center text-sm text-gray-400">
            Sign in to your trading journal
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {error && <Alert variant="destructive">{error}</Alert>}

          <Button
            type="button"
            className="mt-2 w-full rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition hover:bg-green-400 hover:shadow-green-500/40"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
