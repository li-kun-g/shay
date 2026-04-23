export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { isOfficial: true },
  });

  if (!me?.isOfficial) redirect("/");

  // Posts that have at least one report, ordered by report count desc
  const reported = await prisma.post.findMany({
    where: {
      reports: { some: {} },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      anonymous: true,
      status: true,
      deletedAt: true,
      createdAt: true,
      imageUrl: true,
      author: { select: { username: true } },
      _count: { select: { reports: true } },
    },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-2">Reported Posts</h1>
      <p className="text-sm text-gray-500 mb-6">
        {reported.length} post{reported.length !== 1 ? "s" : ""} with reports
      </p>

      {reported.length === 0 ? (
        <div className="text-center py-20 rounded-xl border-2 border-dashed text-gray-400">
          No reports yet ✅
        </div>
      ) : (
        <div className="space-y-4">
          {reported.map((post) => (
            <div
              key={post.id}
              className={`p-4 rounded-xl border shadow-sm ${
                post.deletedAt
                  ? "opacity-50 border-dashed"
                  : "bg-white dark:bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span className="font-medium uppercase tracking-wide">
                    {post.anonymous ? "Anonymous" : `@${post.author.username}`}
                  </span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span
                    className={`font-semibold ${
                      post.status === "APPROVED"
                        ? "text-green-600"
                        : post.status === "REJECTED"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {post.status}
                  </span>
                  {post.deletedAt && (
                    <span className="text-red-400 font-semibold">DELETED</span>
                  )}
                </div>

                <span className="shrink-0 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold">
                  🚩 {post._count.reports} report{post._count.reports !== 1 ? "s" : ""}
                </span>
              </div>

              {post.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                  {post.content}
                </p>
              )}

              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt="post"
                  className="rounded-lg max-h-48 object-cover w-full mb-2"
                />
              )}

              <p className="text-xs text-gray-400">Post ID: {post.id}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
