// app/api/users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TAKE = 15;

type CursorValue = { username: string; id: string } | null;

type BasicUserRow = {
  id: string;
  username: string;
};

type FriendshipRow = {
  userAId: string;
  userBId: string;
};

type OutgoingRequestRow = {
  toId: string;
};

type IncomingRequestRow = {
  fromId: string;
};

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { username: string; id: string }) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

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

  const baseWhere: Record<string, unknown> = {
    id: { not: myId },
  };

  let users: BasicUserRow[] = [];

  if (!q) {
    let where: Record<string, unknown> = baseWhere;

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
      orderBy: [{ username: "asc" }, { id: "asc" }],
      take: TAKE,
      select: { id: true, username: true },
    });
  } else {
    const exact: BasicUserRow | null = !cursor
      ? await prisma.user.findFirst({
          where: { ...baseWhere, username: q },
          select: { id: true, username: true },
        })
      : null;

    const prefixBaseWhere: Record<string, unknown> = {
      ...baseWhere,
      username: { startsWith: q },
      ...(exact ? { id: { not: exact.id } } : {}),
    };

    let prefixWhere: Record<string, unknown> = prefixBaseWhere;

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

    const prefix: BasicUserRow[] = await prisma.user.findMany({
      where: prefixWhere,
      orderBy: [{ username: "asc" }, { id: "asc" }],
      take: TAKE - (exact ? 1 : 0),
      select: { id: true, username: true },
    });

    users = exact ? [exact, ...prefix] : prefix;
  }

  const ids = users.map((u: BasicUserRow) => u.id);

  const friendships: FriendshipRow[] =
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

  const outgoing: OutgoingRequestRow[] =
    ids.length === 0
      ? []
      : await prisma.friendRequest.findMany({
          where: { fromId: myId, toId: { in: ids }, status: "PENDING" },
          select: { toId: true },
        });

  const incoming: IncomingRequestRow[] =
    ids.length === 0
      ? []
      : await prisma.friendRequest.findMany({
          where: { toId: myId, fromId: { in: ids }, status: "PENDING" },
          select: { fromId: true },
        });

  const outgoingSet = new Set(outgoing.map((r: OutgoingRequestRow) => r.toId));
  const incomingSet = new Set(incoming.map((r: IncomingRequestRow) => r.fromId));

  const items = users.map((u: BasicUserRow) => ({
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

  let nextCursor: string | null = null;
  if (users.length === TAKE) {
    const last = users[users.length - 1];
    nextCursor = encodeCursor({ username: last.username, id: last.id });
  }

  return NextResponse.json({ items, nextCursor });
}