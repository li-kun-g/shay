export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TAKE = 12;

type CursorValue = { createdAt: string; id: string } | null;

type FriendUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string;
  major: string | null;
  college: string;
};

type FriendshipRow = {
  id: string;
  createdAt: Date;
  userAId: string;
  userBId: string;
  userA: FriendUser;
  userB: FriendUser;
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

async function viewerIsFriend(viewerId: string, ownerId: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: viewerId, userBId: ownerId },
        { userAId: ownerId, userBId: viewerId },
      ],
    },
    select: { id: true },
  });
  return !!f;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> | { username: string } }
) {
  const params = await Promise.resolve(ctx.params);
  const username = (params?.username ?? "").trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 400 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const session = await getServerSession(authOptions);
  const viewerId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const owner = await prisma.user.findUnique({
    where: { username },
    select: { id: true, friendsListVisibility: true },
  });

  if (!owner) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 404 });
  }

  const isMe = !!viewerId && viewerId === owner.id;
  if (!isMe && owner.friendsListVisibility === ("FRIENDS_ONLY" as any)) {
    if (!viewerId) {
      return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
    }
    const ok = await viewerIsFriend(viewerId, owner.id);
    if (!ok) {
      return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
    }
  }

  const qFilter = q
    ? {
        OR: [
          { username: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : null;

  const where: Record<string, unknown> = {
    OR: qFilter
      ? [
          { userAId: owner.id, userB: qFilter },
          { userBId: owner.id, userA: qFilter },
        ]
      : [{ userAId: owner.id }, { userBId: owner.id }],
  };

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);
    where.AND = [
      {
        OR: [
          { createdAt: { lt: cDate } },
          { createdAt: cDate, id: { lt: cursor.id } },
        ],
      },
    ];
  }

  const rows: FriendshipRow[] = await prisma.friendship.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: TAKE,
    include: {
      userA: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
          major: true,
          college: true,
        },
      },
      userB: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
          major: true,
          college: true,
        },
      },
    },
  });

  const items = rows.map((f: FriendshipRow) =>
    f.userAId === owner.id ? f.userB : f.userA
  );

  let nextCursor: string | null = null;
  if (rows.length === TAKE) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}