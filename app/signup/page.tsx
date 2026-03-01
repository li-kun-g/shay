"use client";

import { useState, useTransition, useMemo } from "react";
import { registerUser } from "@/app/actions/registerUser";
import { signIn } from "next-auth/react";
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

  // 🔹 preview normalized username (UX only)
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
        await registerUser({
          name,
          username: normalizedUsername,
          email: normalizedEmail,
          password,
        });

        // auto-login after signup
        await signIn("credentials", {
          email: normalizedEmail,
          password,
          callbackUrl: "/",
          redirect: true,
        });
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

  return (
    <main className="min-h-[100vh] flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Create your KIMEPish ☕</h1>
        <p className="text-sm text-gray-600 mt-1">
          Choose a unique username to join the campus tea.
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {/* Name */}
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Username */}
          <div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {username && (
              <p className="mt-1 text-xs text-gray-500">
                Your profile will be:{" "}
                <span className="font-medium">
                  /u/{normalizedUsername || "…"}
                </span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
                email.length === 0
                  ? "focus:ring-black"
                  : emailLooksValid
                  ? "border-green-300 focus:ring-green-500"
                  : "border-red-300 focus:ring-red-500",
              ].join(" ")}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <p className="mt-1 text-xs text-gray-500">
              Use your KIMEP email address (<span className="font-medium">@kimep.kz</span>)
            </p>

            {email.length > 0 && !emailLooksValid && (
              <p className="mt-1 text-xs text-red-600">
                Only @kimep.kz emails are allowed.
              </p>
            )}
          </div>

          {/* Password */}
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={isPending || !canSubmit}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Sign up"}
          </button>

          <p className="text-sm text-gray-600 text-center">
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