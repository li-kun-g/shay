export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TagsClient from "./TagsClient";

export default async function AdminTagsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { isOfficial: true },
  });

  if (!me?.isOfficial) redirect("/");

  const tags = await prisma.postTag.findMany({ orderBy: { order: "asc" } });

  // Count posts per tag slug
  const counts = await prisma.post.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  const postCounts: Record<string, number> = {};
  for (const c of counts) postCounts[c.category] = c._count._all;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post Tags</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the category tags users can pick when posting. The 5 default tags are always available. Deleting a tag moves all its posts to <span className="font-mono font-medium">OTHER</span>.
        </p>
      </div>

      <TagsClient tags={tags} postCounts={postCounts} />
    </main>
  );
}
