// app/api/u/[username]/posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function decodeCursor(cursor: string | null): any | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function encodeCursor(obj: any) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

const TAKE = 15;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> | { username: string } }
) {
  const { searchParams } = new URL(req.url);
  const cursor = decodeCursor(searchParams.get("cursor"));

  const p = await Promise.resolve(ctx.params);
  const username = (p?.username ?? "").trim().toLowerCase();
  if (!username) return NextResponse.json({ items: [], nextCursor: null });

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ items: [], nextCursor: null });

  // ✅ IMPORTANT: hide anonymous posts on profile pages
  let where: any = { authorId: user.id, anonymous: false };

  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);
    where = {
      AND: [
        where,
        {
          OR: [
            { createdAt: { lt: cDate } },
            { createdAt: cDate, id: { lt: cursor.id } },
          ],
        },
      ],
    };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: TAKE,
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

      // only my like (0/1) — keeps Shaipost happy and stays fast
      likes: myId
        ? { where: { userId: myId }, select: { userId: true } }
        : { where: { userId: "__nope__" }, select: { userId: true } },

      // only my reactions (for active button state)
      postReactions: myId
        ? { where: { userId: myId }, select: { userId: true, type: true } }
        : {
            where: { userId: "__nope__" },
            select: { userId: true, type: true },
          },

      _count: { select: { likes: true, comments: true } },
    },
  });

  // ✅ Global reaction totals for each post (so profile page counts update correctly)
  const postIds = posts.map((p) => p.id);

  const groupedReactions =
    postIds.length > 0
      ? await prisma.postReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];

  const reactionCountsMap = new Map<string, { LAUGH: number; SKULL: number }>();
  for (const row of groupedReactions) {
    const current = reactionCountsMap.get(row.postId) ?? { LAUGH: 0, SKULL: 0 };
    if (row.type === "LAUGH") current.LAUGH = row._count._all;
    if (row.type === "SKULL") current.SKULL = row._count._all;
    reactionCountsMap.set(row.postId, current);
  }

  const items = posts.map((p) => {
    const rc = reactionCountsMap.get(p.id) ?? { LAUGH: 0, SKULL: 0 };

    return {
      ...p,
      // ✅ fields Shaipost can use for exact counts
      reactionCounts: rc,
      laughCount: rc.LAUGH,
      skullCount: rc.SKULL,

      createdAt:
        (p as any).createdAt instanceof Date
          ? (p as any).createdAt.toISOString()
          : (p as any).createdAt,
      updatedAt:
        (p as any).updatedAt instanceof Date
          ? (p as any).updatedAt.toISOString()
          : (p as any).updatedAt,
    };
  });

  let nextCursor: string | null = null;
  if (posts.length === TAKE) {
    const last = posts[posts.length - 1];
    nextCursor = encodeCursor({
      createdAt: (last as any).createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}