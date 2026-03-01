export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import Link from "next/link";

type SP = { token?: string };

export default async function VerifyEmailPage(props: {
  searchParams?: SP | Promise<SP>;
}) {
  const sp = await Promise.resolve(props.searchParams);
  const token = (sp?.token ?? "").trim();

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Invalid link</h1>
          <p className="text-sm text-gray-600 mt-1">Missing token.</p>
          <Link
            href="/signin"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Link expired</h1>
          <p className="text-sm text-gray-600 mt-1">
            Please sign up again to get a new verification email.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Go to signup
          </Link>
        </div>
      </main>
    );
  }

  // mark verified (idempotent)
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  // delete token
  await prisma.emailVerificationToken.delete({
    where: { token },
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Email verified ✅</h1>
        <p className="text-sm text-gray-600 mt-1">
          You can now log in and spill responsibly ☕
        </p>

        <Link
          href="/signin"
          className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
