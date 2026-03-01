export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import Shaipost from "@/components/Shaipost";
import PostCommentsInfiniteList from "@/components/PostCommentsInfiniteList";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getDict, type Lang } from "@/lib/i18n";

type Params = { id: string };

const LANG_COOKIE = "kimepish-lang";

export default async function PostPage(props: { params: Params | Promise<Params> }) {
  const p = await Promise.resolve(props.params);
  const postId = (p?.id ?? "").trim();
  if (!postId) notFound();

  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value as Lang | undefined;
  const lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";
  const dict = getDict(lang);

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
          college: true,
        },
      },

      likes: myId
        ? { where: { userId: myId }, select: { userId: true } }
        : { where: { userId: "__nope__" }, select: { userId: true } },

      postReactions: myId
        ? { where: { userId: myId }, select: { userId: true, type: true } }
        : { where: { userId: "__nope__" }, select: { userId: true, type: true } },

      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) notFound();

  const reactionAgg = await prisma.postReaction.groupBy({
    by: ["type"],
    where: { postId: post.id },
    _count: { _all: true },
  });

  const reactionCounts = { LAUGH: 0, SKULL: 0 };
  for (const r of reactionAgg) {
    if (r.type === "LAUGH") reactionCounts.LAUGH = r._count._all;
    if (r.type === "SKULL") reactionCounts.SKULL = r._count._all;
  }

  const postForShaipost = {
    ...post,
    reactionCounts,
    laughCount: reactionCounts.LAUGH,
    skullCount: reactionCounts.SKULL,
    createdAt:
      (post as any).createdAt instanceof Date
        ? (post as any).createdAt.toISOString()
        : (post as any).createdAt,
    updatedAt:
      (post as any).updatedAt instanceof Date
        ? (post as any).updatedAt.toISOString()
        : (post as any).updatedAt,
  };

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{dict["post.title"]}</h1>
            <p className="text-sm text-gray-500">{dict["post.openedFromNotification"]}</p>
          </div>

          <Link
            href={`/u/${post.author.username}`}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            @{post.author.username}
          </Link>
        </div>
      </section>

      <Shaipost post={postForShaipost as any} myUserId={myId} />

      <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{dict["comments.sectionTitle"]}</h2>
          <div className="text-sm text-gray-500">{post._count.comments}</div>
        </div>

        <PostCommentsInfiniteList postId={post.id} totalCount={post._count.comments} />
      </section>
    </main>
  );
}