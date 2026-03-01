// app/api/users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TAKE = 15;

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

// Cursor is stable for username asc, id asc: { username: string, id: string }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const cursor = decodeCursor(searchParams.get("cursor"));

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!myId) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 401 });
  }

  // Base filters
  const baseWhere: any = {
    id: { not: myId },
  };

  // ---------- 1) Fetch users ----------
  let users: { id: string; username: string }[] = [];

  if (!q) {
    // No search: normal paged list
    let where: any = baseWhere;

    if (cursor?.username && cursor?.id) {
      where = {
        AND: [
          baseWhere,
          {
            OR: [
              { username: { gt: cursor.username } },
              { username: cursor.username, id: { gt: cursor.id } },
            ],
          },
        ],
      };
    }

    users = await prisma.user.findMany({
      where,
      orderBy: [{ username: "asc" as const }, { id: "asc" as const }],
      take: TAKE,
      select: { id: true, username: true },
    });
  } else {
    // Search mode:
    // 1) exact match first (optional)
    // 2) then prefix matches (startsWith), stable ordered, cursor applies to the prefix list

    const exact =
      !cursor // only show exact match on first page for that search
        ? await prisma.user.findFirst({
            where: { ...baseWhere, username: q },
            select: { id: true, username: true },
          })
        : null;

    // Prefix list (exclude exact if we already added it)
    const prefixBaseWhere: any = {
      ...baseWhere,
      username: { startsWith: q },
      ...(exact ? { id: { not: exact.id } } : {}),
    };

    let prefixWhere: any = prefixBaseWhere;

    if (cursor?.username && cursor?.id) {
      prefixWhere = {
        AND: [
          prefixBaseWhere,
          {
            OR: [
              { username: { gt: cursor.username } },
              { username: cursor.username, id: { gt: cursor.id } },
            ],
          },
        ],
      };
    }

    const prefix = await prisma.user.findMany({
      where: prefixWhere,
      orderBy: [{ username: "asc" as const }, { id: "asc" as const }],
      take: TAKE - (exact ? 1 : 0),
      select: { id: true, username: true },
    });

    users = exact ? [exact, ...prefix] : prefix;
  }

  const ids = users.map((u) => u.id);

  // ---------- 2) Friendship/request status (bulk) ----------
  const friendships =
    ids.length === 0
      ? []
      : await prisma.friendship.findMany({
          where: {
            OR: [
              { userAId: myId, userBId: { in: ids } },
              { userBId: myId, userAId: { in: ids } },
            ],
          },
          select: { userAId: true, userBId: true },
        });

  const friendsSet = new Set<string>();
  for (const f of friendships) {
    const other = f.userAId === myId ? f.userBId : f.userAId;
    friendsSet.add(other);
  }

  const outgoing =
    ids.length === 0
      ? []
      : await prisma.friendRequest.findMany({
          where: { fromId: myId, toId: { in: ids }, status: "PENDING" },
          select: { toId: true },
        });

  const incoming =
    ids.length === 0
      ? []
      : await prisma.friendRequest.findMany({
          where: { toId: myId, fromId: { in: ids }, status: "PENDING" },
          select: { fromId: true },
        });

  const outgoingSet = new Set(outgoing.map((r) => r.toId));
  const incomingSet = new Set(incoming.map((r) => r.fromId));

  const items = users.map((u) => ({
    id: u.id,
    username: u.username,
    status: friendsSet.has(u.id)
      ? ("FRIENDS" as const)
      : outgoingSet.has(u.id)
      ? ("PENDING_OUT" as const)
      : incomingSet.has(u.id)
      ? ("PENDING_IN" as const)
      : ("NONE" as const),
  }));

  // ---------- 3) nextCursor ----------
  // For search mode: cursor applies to the ordered username list (after exact match).
  let nextCursor: string | null = null;

  if (users.length === TAKE) {
    const last = users[users.length - 1];
    nextCursor = encodeCursor({ username: last.username, id: last.id });
  }

  return NextResponse.json({ items, nextCursor });
}
