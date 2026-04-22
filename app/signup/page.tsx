"use client";

import { useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "@/app/actions/registerUser";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const emailLooksValid = normalizedEmail.length > 0 && isKimepEmail(normalizedEmail);

  function handleGoogleSignUp() {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/" });
  }

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
          setIsSuccess(true);
        }
      } catch (error: unknown) {
        setErr(error instanceof Error ? error.message : "Failed to sign up");
      }
    });
  }

  const canSubmit =
    name.trim().length > 0 &&
    normalizedEmail.length > 0 &&
    password.length >= 8 &&
    normalizedUsername.length >= 3 &&
    emailLooksValid;

  const SignUpHeader = (
    <div className="mb-8 flex items-center justify-between border-b border-[#1e1e1e] pb-4">
      <Link href="/" className="flex items-center gap-2 text-[18px] font-medium tracking-[-0.3px] text-white">
        <span className="font-extrabold tracking-[-0.02em] text-[#AFA9EC]">Shay</span>
        <Image
          src="/logo_white_transparent.png"
          alt="Shay logo"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      </Link>
      <Link href="/signin" className="text-[13px] text-[#777] transition hover:text-white">
        Already have an account?
      </Link>
    </div>
  );

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-10 text-[#f0f0f0] sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          {SignUpHeader}
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl border border-[#2a2560] bg-[#100f1e] p-8 text-center">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="text-2xl font-medium text-white">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#8f8aaf]">
            We sent a confirmation link to <br />
            <span className="font-semibold text-white">{normalizedEmail}</span>
          </p>

          <div className="mt-6 rounded-2xl border border-[#3C3489] bg-[#1a1528] p-4 text-xs text-[#AFA9EC]">
            Check Spam/Junk if you do not see it in inbox.
          </div>

          <Link
            href="/signin"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#f8f8f8] px-4 py-3 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#e8e8e8]"
          >
            Back to Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        {SignUpHeader}

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <section>
            <div className="mb-6 inline-flex items-center gap-[6px] rounded-full border border-[#3C3489] bg-[#1a1528] px-[14px] py-[5px] text-[12px] text-[#AFA9EC]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#7F77DD]" />
              Registration is open for KIMEP students
            </div>
            <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-[-1.5px] text-white sm:text-[56px]">
              Join Shay with
              <br />
              <span className="text-[#7F77DD]">Google first</span>
            </h1>
            <p className="mt-5 max-w-[520px]  text-[16px] font-medium leading-[1.7] text-[#666] sm:text-[17px]">
              Independent student network. No ads, no password storage, real university community only.
            </p>
          </section>

          <section className="rounded-[20px] border border-[#2a2560] bg-[#100f1e] p-6 sm:p-8">
            <p className="mt-2 text-sm text-[#777]">Start with Google.</p>

            <button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-[10px] rounded-[10px] bg-[#f8f8f8] px-6 py-[14px] text-[15px] font-medium text-[#1a1a1a] transition hover:bg-[#e8e8e8] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <span className="animate-spin">⏳</span> 
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="my-5 h-px bg-[#2a2a2a]" />

            {err && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

            <div className="space-y-3">
              <input
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f16] px-3 py-2 text-sm outline-none focus:border-[#3C3489]"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f16] px-3 py-2 text-sm outline-none focus:border-[#3C3489]"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {username && <p className="mt-1 text-xs text-[#666]">Your profile: /u/{normalizedUsername}</p>}
              </div>

              <div>
                <input
                  className={[
                    "w-full rounded-xl border bg-[#0f0f16] px-3 py-2 text-sm outline-none",
                    email.length === 0
                      ? "border-[#2a2a2a] focus:border-[#3C3489]"
                      : emailLooksValid
                      ? "border-green-500/40 focus:border-green-500"
                      : "border-red-500/40 focus:border-red-500",
                  ].join(" ")}
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-[#666]">Use @kimep.kz email</p>
              </div>

              <div>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f16] px-3 py-2 text-sm outline-none focus:border-[#3C3489]"
                  placeholder="Password (min 8 chars)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-[#666]">Use at least 8 characters.</p>
              </div>
              <p className="pt-1 text-center text-sm text-[#777]">
                Already have an account?{" "}
                <Link className="underline hover:text-white" href="/signin">
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
