// app/api/notifications/route.ts
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

// ✅ New limits
const PAGE_SIZE = 50;   // first load and each page size
const MAX_TOTAL = 100;  // never show more than latest 100

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!userId) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = decodeCursor(searchParams.get("cursor"));

  // ✅ Track how many have already been served to this client
  const served = typeof cursor?.served === "number" ? cursor.served : 0;
  const remaining = Math.max(0, MAX_TOTAL - served);

  if (remaining <= 0) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  // Fetch at most PAGE_SIZE, but never exceed MAX_TOTAL
  const take = Math.min(PAGE_SIZE, remaining);

  let where: any = { userId };
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  // Cursor pagination by (createdAt desc, id desc)
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

  const rows = await prisma.notification.findMany({
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

  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    isRead: n.isRead,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : (n.createdAt as any),
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

  // Only continue if:
  // 1) we filled the page, and
  // 2) we still haven't reached MAX_TOTAL
  if (rows.length === take && served + rows.length < MAX_TOTAL) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
      served: served + rows.length, // ✅ carry forward progress
    });
  }

  return NextResponse.json({ items, nextCursor });
}