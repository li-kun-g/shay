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

  // Helper for the Card Container to keep code DRY
  const Container = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-black px-4 transition-colors">
      <div className="max-w-md w-full rounded-3xl border bg-white dark:bg-[#111] p-8 shadow-sm border-gray-200 dark:border-white/10 text-center">
        {children}
      </div>
    </main>
  );

  if (!token) {
    return (
      <Container>
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold dark:text-white">Invalid link</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          The verification token is missing.
        </p>
        <Link
          href="/signin"
          className="mt-6 block w-full rounded-xl bg-black dark:bg-white dark:text-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Back to Login
        </Link>
      </Container>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return (
      <Container>
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-xl font-semibold dark:text-white">Link expired</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          This link has expired. Please sign up again to receive a new verification email.
        </p>
        <Link
          href="/signup"
          className="mt-6 block w-full rounded-xl bg-black dark:bg-white dark:text-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Go to Sign up
        </Link>
      </Container>
    );
  }

  // Mark verified
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  // Delete token
  await prisma.emailVerificationToken.delete({
    where: { token },
  });

  return (
    <Container>
      <div className="text-4xl mb-4">✅</div>
      <h1 className="text-2xl font-semibold tracking-tight dark:text-white">Email verified</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
        Your account is now active. You can now log in and join the KIMEP community ☕
      </p>

      <Link
        href="/signin"
        className="mt-8 block w-full rounded-xl bg-black dark:bg-white dark:text-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Sign in to KIMEPish
      </Link>
    </Container>
  );
}