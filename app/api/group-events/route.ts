// app/api/group-events/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SortKey = "soon" | "going" | "new";

function parseSort(v: string | null): SortKey {
  if (v === "going" || v === "new" || v === "soon") return v;
  return "soon";
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

// stable label (no locale hydration mismatch)
function toLabel(d: Date) {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const TAKE = 15;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const groupId = (searchParams.get("groupId") ?? "").trim();
  if (!groupId) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 400 });
  }

  const sort = parseSort(searchParams.get("sort"));
  const cursorRaw = searchParams.get("cursor");
  const cursor = decodeCursor(cursorRaw);

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  let where: any = { groupId };
  let orderBy: any[] = [];
  let skip = 0;

  if (sort === "soon") {
    orderBy = [{ startsAt: "asc" as const }, { id: "asc" as const }];

    if (cursor?.startsAt && cursor?.id) {
      const cDate = new Date(cursor.startsAt);
      where = {
        groupId,
        OR: [
          { startsAt: { gt: cDate } },
          { startsAt: cDate, id: { gt: cursor.id } },
        ],
      };
    }
  } else if (sort === "new") {
    orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

    if (cursor?.createdAt && cursor?.id) {
      const cDate = new Date(cursor.createdAt);
      where = {
        groupId,
        OR: [
          { createdAt: { lt: cDate } },
          { createdAt: cDate, id: { lt: cursor.id } },
        ],
      };
    }
  } else {
    // "going" (offset paging for now)
    orderBy = [
      { attendees: { _count: "desc" as const } },
      { startsAt: "asc" as const },
      { id: "asc" as const },
    ];

    const offset = typeof cursor?.offset === "number" ? cursor.offset : 0;
    skip = offset;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy,
    take: TAKE,
    skip,
    include: {
      createdBy: {
        select: { username: true, name: true, image: true, emoji: true },
      },
      _count: { select: { attendees: true } },
      group: { select: { slug: true, image: true, name: true } },
      attendees: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              emoji: true,
            },
          },
        },
      },
    },
  });

  const eventIds = events.map((e) => e.id);

  // goingByMe
  const myGoingSet = new Set<string>();
  if (myId && eventIds.length > 0) {
    const mine = await prisma.eventAttendance.findMany({
      where: { userId: myId, eventId: { in: eventIds } },
      select: { eventId: true },
    });
    mine.forEach((r) => myGoingSet.add(r.eventId));
  }

 const items = events.map((e) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  location: e.location,

  // ✅ send raw ISO string (client formats it)
  startsAt: e.startsAt.toISOString(),

  // optional compatibility if any old UI still reads this:
  startsAtLabel: toLabel(e.startsAt),

  createdBy: e.createdBy,
  group: e.group,

  goingCount: e._count.attendees,
  goingByMe: myGoingSet.has(e.id),
  attendeesPreview: e.attendees.map((a) => a.user),

  imageUrl: e.imageUrl ?? null,
}));

  let nextCursor: string | null = null;
  if (events.length === TAKE) {
    const last = events[events.length - 1];

    if (sort === "soon") {
      nextCursor = encodeCursor({
        startsAt: last.startsAt.toISOString(),
        id: last.id,
      });
    } else if (sort === "new") {
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
