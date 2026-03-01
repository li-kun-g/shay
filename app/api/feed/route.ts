// app/api/feed/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SortKey = "latest" | "top";
type AnonKey = "all" | "anon" | "non";

function parseSort(v: string | null): SortKey {
  return v === "top" ? "top" : "latest";
}

function parseAnon(v: string | null): AnonKey {
  if (v === "anon" || v === "non" || v === "all") return v;
  return "all";
}

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

  // filters
  let where: any = {};
  if (cat) where.category = cat;
  if (anon === "anon") where.anonymous = true;
  if (anon === "non") where.anonymous = false;

  let orderBy: any[] = [];
  let skip = 0;

  // Cursor pagination for latest, offset for top
  if (sort === "latest") {
    orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

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
    // top
    orderBy = [
      { likes: { _count: "desc" as const } },
      { createdAt: "desc" as const },
      { id: "desc" as const },
    ];

    const offset = typeof cursor?.offset === "number" ? cursor.offset : 0;
    skip = offset;
  }

  const posts = await prisma.post.findMany({
    where: Object.keys(where).length ? where : undefined,
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

      // only my like (0/1)
      likes: myId
        ? { where: { userId: myId }, select: { userId: true } }
        : { where: { userId: "__nope__" }, select: { userId: true } },

      // only my reactions (can be both)
      postReactions: myId
        ? { where: { userId: myId }, select: { userId: true, type: true } }
        : { where: { userId: "__nope__" }, select: { userId: true, type: true } },

      _count: { select: { likes: true, comments: true } },
    },
  });

  // ✅ Reaction totals for all posts in this page
  const postIds = posts.map((p) => p.id);

  const reactionAgg =
    postIds.length > 0
      ? await prisma.postReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];

  const reactionMap = new Map<string, { LAUGH: number; SKULL: number }>();
  for (const r of reactionAgg) {
    const current = reactionMap.get(r.postId) ?? { LAUGH: 0, SKULL: 0 };
    if (r.type === "LAUGH") current.LAUGH = r._count._all;
    if (r.type === "SKULL") current.SKULL = r._count._all;
    reactionMap.set(r.postId, current);
  }

  const items = posts.map((p) => {
    const rc = reactionMap.get(p.id) ?? { LAUGH: 0, SKULL: 0 };

    return {
      ...p,
      reactionCounts: rc,
      laughCount: rc.LAUGH,
      skullCount: rc.SKULL,
      createdAt:
        (p as any).createdAt instanceof Date
          ? (p as any).createdAt.toISOString()
          : (p as any).createdAt,
    };
  });

  let nextCursor: string | null = null;
  if (posts.length === TAKE) {
    const last = posts[posts.length - 1];

    if (sort === "latest") {
      nextCursor = encodeCursor({
        createdAt: (last as any).createdAt.toISOString(),
        id: last.id,
      });
    } else {
      const currentOffset = typeof cursor?.offset === "number" ? cursor.offset : 0;
      nextCursor = encodeCursor({ offset: currentOffset + TAKE });
    }
  }

  return NextResponse.json({ items, nextCursor });
}