// app/api/u/[username]/posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CursorValue = { createdAt: string; id: string } | null;
type ReactionType = "LAUGH" | "SKULL";

type PostRow = {
  id: string;
  content: string;
  anonymous: boolean;
  category: string;
  imageUrl: string | null;
  imageKey?: string | null;
  createdAt: Date;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
    college: string;
  };
  likes: Array<{ userId: string }>;
  postReactions: Array<{ userId: string; type: ReactionType }>;
  _count: {
    likes: number;
    comments: number;
  };
};

type ReactionAggRow = {
  postId: string;
  type: ReactionType;
  _count: { _all: number };
};

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { createdAt: string; id: string }) {
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
  if (!username) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  let where: Record<string, unknown> = { authorId: user.id, anonymous: false };

  const orderBy: Array<Record<string, unknown>> = [
    { createdAt: "desc" },
    { id: "desc" },
  ];

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

  const posts: PostRow[] = await prisma.post.findMany({
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
      likes: myId
        ? { where: { userId: myId }, select: { userId: true } }
        : { where: { userId: "__nope__" }, select: { userId: true } },
      postReactions: myId
        ? { where: { userId: myId }, select: { userId: true, type: true } }
        : {
            where: { userId: "__nope__" },
            select: { userId: true, type: true },
          },
      // ✅ Исправлено: Считаем только одобренные комментарии
      _count: { 
        select: { 
          likes: true, 
          comments: {
            where: { status: "APPROVED" }
          } 
        } 
      },
    },
  });

  const postIds = posts.map((p: PostRow) => p.id);

  const groupedReactionsRaw =
    postIds.length > 0
      ? await prisma.postReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];

  const groupedReactions = groupedReactionsRaw as ReactionAggRow[];

  const reactionCountsMap = new Map<string, { LAUGH: number; SKULL: number }>();
  for (const row of groupedReactions) {
    const current = reactionCountsMap.get(row.postId) ?? { LAUGH: 0, SKULL: 0 };
    if (row.type === "LAUGH") current.LAUGH = row._count._all;
    if (row.type === "SKULL") current.SKULL = row._count._all;
    reactionCountsMap.set(row.postId, current);
  }

  const items = posts.map((p: PostRow) => {
    const rc = reactionCountsMap.get(p.id) ?? { LAUGH: 0, SKULL: 0 };

    return {
      ...p,
      reactionCounts: rc,
      laughCount: rc.LAUGH,
      skullCount: rc.SKULL,
      createdAt: p.createdAt.toISOString(),
    };
  });

  let nextCursor: string | null = null;
  if (posts.length === TAKE) {
    const last = posts[posts.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}