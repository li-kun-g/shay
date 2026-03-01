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

      // redirect:true usually navigates automatically
      if ((res as any)?.error) setErr("Wrong email or password");
    });
  }

  return (
    <main className="min-h-[100vh] flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Welcome back ☕</h1>
        <p className="text-sm text-gray-600 mt-1">Log in to spill your tea.</p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={onSubmit}
            disabled={isPending || !email || !password}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-gray-600 text-center">
            No account?{" "}
            <Link className="underline" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
