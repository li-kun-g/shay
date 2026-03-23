// app/api/feed/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SortKey = "latest" | "top";
type AnonKey = "all" | "anon" | "non";
type CursorValue = { createdAt?: string; id?: string; offset?: number } | null;

type ReactionType = "LAUGH" | "SKULL";

type PostRow = {
  id: string;
  content: string;
  anonymous: boolean;
  category: string;
  imageUrl: string | null;
  createdAt: Date;
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

function parseSort(v: string | null): SortKey {
  return v === "top" ? "top" : "latest";
}

function parseAnon(v: string | null): AnonKey {
  if (v === "anon" || v === "non" || v === "all") return v;
  return "all";
}

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { createdAt?: string; id?: string; offset?: number }) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

const TAKE = 15;
const CAT_VALUES = new Set(["GOSSIPS", "UNI", "CONFESSIONS", "MARKET", "OTHER"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const sort = parseSort(searchParams.get("sort"));

  const rawCat = (searchParams.get("cat") ?? "").trim().toUpperCase();
  const cat = CAT_VALUES.has(rawCat) ? rawCat : null;

  const anon = parseAnon((searchParams.get("anon") ?? "").trim().toLowerCase());

  const cursor = decodeCursor(searchParams.get("cursor"));

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  // ✅ MODIFIED: Initialize where with status: "APPROVED"
  let where: Record<string, any> = {
    status: "APPROVED",
  };

  if (cat) where.category = cat;
  if (anon === "anon") where.anonymous = true;
  if (anon === "non") where.anonymous = false;

  let orderBy: Array<Record<string, unknown>> = [];
  let skip = 0;

  if (sort === "latest") {
    orderBy = [{ createdAt: "desc" }, { id: "desc" }];

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
  } else {
    orderBy = [
      { likes: { _count: "desc" } },
      { createdAt: "desc" },
      { id: "desc" },
    ];

    const offset = typeof cursor?.offset === "number" ? cursor.offset : 0;
    skip = offset;
  }

  const posts: PostRow[] = await prisma.post.findMany({
    where, // ✅ No longer need undefined check because status is always present
    orderBy,
    take: TAKE,
    skip,
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
      
      // ✅ ИСПРАВЛЕНИЕ ЗДЕСЬ: Считаем только APPROVED комментарии
      _count: { 
        select: { 
          likes: true, 
          comments: {
            where: {
              status: "APPROVED"
            }
          } 
        } 
      },
    },
  });

  const postIds = posts.map((p: PostRow) => p.id);

  const reactionAggRaw =
    postIds.length > 0
      ? await prisma.postReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];

  const reactionAgg = reactionAggRaw as ReactionAggRow[];

  const reactionMap = new Map<string, { LAUGH: number; SKULL: number }>();
  for (const r of reactionAgg) {
    const current = reactionMap.get(r.postId) ?? { LAUGH: 0, SKULL: 0 };
    if (r.type === "LAUGH") current.LAUGH = r._count._all;
    if (r.type === "SKULL") current.SKULL = r._count._all;
    reactionMap.set(r.postId, current);
  }

  const items = posts.map((p: PostRow) => {
    const rc = reactionMap.get(p.id) ?? { LAUGH: 0, SKULL: 0 };

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

    if (sort === "latest") {
      nextCursor = encodeCursor({
        createdAt: last.createdAt.toISOString(),
        id: last.id,
      });
    } else {
      const currentOffset = typeof cursor?.offset === "number" ? cursor.offset : 0;
      nextCursor = encodeCursor({ offset: currentOffset + TAKE });
    }
  }

  return NextResponse.json({ items, nextCursor });
}