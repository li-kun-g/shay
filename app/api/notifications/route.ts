// app/api/notifications/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CursorValue = {
  createdAt?: string;
  id?: string;
  served?: number;
} | null;

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  } | null;
};

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { createdAt: string; id: string; served: number }) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

const PAGE_SIZE = 50;
const MAX_TOTAL = 100;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!userId) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = decodeCursor(searchParams.get("cursor"));

  const served = typeof cursor?.served === "number" ? cursor.served : 0;
  const remaining = Math.max(0, MAX_TOTAL - served);

  if (remaining <= 0) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const take = Math.min(PAGE_SIZE, remaining);

  let where: Record<string, unknown> = { userId };
  const orderBy: Array<Record<string, unknown>> = [
    { createdAt: "desc" },
    { id: "desc" },
  ];

  if (cursor?.createdAt && cursor?.id) {
    const cDate = new Date(cursor.createdAt);

    where = {
      userId,
      OR: [
        { createdAt: { lt: cDate } },
        { createdAt: cDate, id: { lt: cursor.id } },
      ],
    };
  }

  const rows: NotificationRow[] = await prisma.notification.findMany({
    where,
    orderBy,
    take,
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          emoji: true,
        },
      },
    },
  });

  const items = rows.map((n: NotificationRow) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor
      ? {
          id: n.actor.id,
          username: n.actor.username,
          name: n.actor.name,
          image: n.actor.image,
          emoji: n.actor.emoji,
        }
      : null,
  }));

  let nextCursor: string | null = null;

  if (rows.length === take && served + rows.length < MAX_TOTAL) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
      served: served + rows.length,
    });
  }

  return NextResponse.json({ items, nextCursor });
}