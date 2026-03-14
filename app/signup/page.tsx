"use client";

import { useState, useTransition, useMemo } from "react";
import { registerUser } from "@/app/actions/registerUser";
import Link from "next/link";
import { normalizeUsername } from "@/lib/username";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isKimepEmail(email: string) {
  return /^[a-z0-9._%+-]+@kimep\.kz$/.test(normalizeEmail(email));
}

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false); // New state for the success view

  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username]
  );

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const emailLooksValid = normalizedEmail.length > 0 && isKimepEmail(normalizedEmail);

  function onSubmit() {
    setErr(null);

    if (!isKimepEmail(email)) {
      setErr("Please use your @kimep.kz email address.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await registerUser({
          name,
          username: normalizedUsername,
          email: normalizedEmail,
          password,
        });

        if (res.ok) {
          setIsSuccess(true); // Show success screen instead of auto-login
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to sign up");
      }
    });
  }

  const canSubmit =
    name.trim().length > 0 &&
    normalizedEmail.length > 0 &&
    password.length >= 8 &&
    normalizedUsername.length >= 3 &&
    emailLooksValid;

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <main className="min-h-[100vh] flex items-center justify-center px-4 bg-[#FAF7F2] dark:bg-black">
        <div className="w-full max-w-sm rounded-3xl border bg-white dark:bg-[#111] p-8 shadow-sm text-center border-gray-200 dark:border-white/10">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
            We sent a confirmation link to <br />
            <span className="font-semibold text-black dark:text-white">{normalizedEmail}</span>
          </p>
          
          <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-200">
            <strong>Pro tip:</strong> If you don't see it, please check your <strong>Spam</strong> or Junk folder. The filters can be strict!
          </div>

          <Link
            href="/signin"
            className="mt-8 block w-full rounded-xl bg-black dark:bg-white dark:text-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Back to Log in
          </Link>
        </div>
      </main>
    );
  }

  // --- FORM VIEW ---
  return (
    <main className="min-h-[100vh] flex items-center justify-center px-4 bg-[#FAF7F2] dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border bg-white dark:bg-[#111] p-5 shadow-sm dark:border-white/10">
        <h1 className="text-xl font-semibold dark:text-white">Create your KIMEPish ☕</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose a unique username to join the campus tea.
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border dark:border-white/10 dark:bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <input
              className="w-full rounded-xl border dark:border-white/10 dark:bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {username && (
              <p className="mt-1 text-xs text-gray-500">
                Your profile: <span className="font-medium">/u/{normalizedUsername}</span>
              </p>
            )}
          </div>

          <div>
            <input
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 dark:bg-transparent",
                email.length === 0
                  ? "focus:ring-black dark:border-white/10"
                  : emailLooksValid
                  ? "border-green-300 focus:ring-green-500"
                  : "border-red-300 focus:ring-red-500",
              ].join(" ")}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Use @kimep.kz email</p>
          </div>

          <input
            className="w-full rounded-xl border dark:border-white/10 dark:bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={onSubmit}
            disabled={isPending || !canSubmit}
            className="w-full rounded-xl bg-black dark:bg-white dark:text-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Sign up"}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Already have an account?{" "}
            <Link className="underline" href="/signin">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}