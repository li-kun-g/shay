"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    setErr(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });

      if ((res as any)?.error) setErr("Wrong email or password");
    });
  }

  return (
    <main className="min-h-[100vh] flex items-center justify-center px-4 bg-[#FAF7F2] dark:bg-black transition-colors">
      <div className="w-full max-w-sm rounded-3xl border bg-white dark:bg-[#111] p-8 shadow-sm border-gray-200 dark:border-white/10 transition-all">
        <h1 className="text-2xl font-semibold tracking-tight dark:text-white">Welcome back ☕</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Log in to spill your tea.
        </p>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {err}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <input
              className="w-full rounded-xl border dark:border-white/10 dark:bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white transition-all"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <input
              className="w-full rounded-xl border dark:border-white/10 dark:bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white transition-all"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Added Forgot Password Link Here */}
            <div className="mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={isPending || !email || !password}
            className="w-full rounded-xl bg-black dark:bg-white dark:text-black mt-2 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
            No account?{" "}
            <Link className="underline text-black dark:text-white font-medium" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}