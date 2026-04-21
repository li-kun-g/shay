import AnonLinkComposer from "@/components/AnonLinkComposer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Spill anonymously · Shay",
  description: "Post anonymously to the Shay campus feed. Your identity stays hidden.",
};

export default async function SpillPage() {
  const tags = await prisma.postTag.findMany({ orderBy: { order: "asc" } });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[var(--bg)]">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Shay ☕
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Spill anonymously to the campus feed.
            <br />
            Your identity stays hidden. Always.
          </p>
        </div>

        {/* Composer */}
        <AnonLinkComposer tags={tags} />

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          By posting you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
