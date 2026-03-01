// app/api/events/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SortKey = "soon" | "going" | "new";

type CursorSoon = { startsAt: string; id: string };
type CursorNew = { createdAt: string; id: string };
type CursorGoing = { offset: number };
type CursorValue = CursorSoon | CursorNew | CursorGoing | null;

type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: Date;
  createdAt: Date;
  imageUrl: string | null;
  createdBy: {
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  };
  group: {
    slug: string;
    image: string | null;
    name: string;
  } | null;
  _count: {
    attendees: number;
  };
  attendees: Array<{
    user: {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
      emoji: string;
    };
  }>;
};

type AttendanceRow = {
  eventId: string;
};

function parseSort(v: string | null): SortKey {
  if (v === "going" || v === "new" || v === "soon") return v;
  return "soon";
}

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: CursorSoon | CursorNew | CursorGoing) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

const TAKE = 15;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = parseSort(searchParams.get("sort"));
  const cursorRaw = searchParams.get("cursor");
  const cursor = decodeCursor(cursorRaw);

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  let where: Record<string, unknown> = {};
  let orderBy: Array<Record<string, unknown>> = [];
  let skip = 0;

  if (sort === "soon") {
    orderBy = [{ startsAt: "asc" }, { id: "asc" }];

    if (
      cursor &&
      "startsAt" in cursor &&
      typeof cursor.startsAt === "string" &&
      "id" in cursor &&
      typeof cursor.id === "string"
    ) {
      const cDate = new Date(cursor.startsAt);
      where = {
        OR: [
          { startsAt: { gt: cDate } },
          { startsAt: cDate, id: { gt: cursor.id } },
        ],
      };
    }
  } else if (sort === "new") {
    orderBy = [{ createdAt: "desc" }, { id: "desc" }];

    if (
      cursor &&
      "createdAt" in cursor &&
      typeof cursor.createdAt === "string" &&
      "id" in cursor &&
      typeof cursor.id === "string"
    ) {
      const cDate = new Date(cursor.createdAt);
      where = {
        OR: [
          { createdAt: { lt: cDate } },
          { createdAt: cDate, id: { lt: cursor.id } },
        ],
      };
    }
  } else {
    orderBy = [
      { attendees: { _count: "desc" } },
      { startsAt: "asc" },
      { id: "asc" },
    ];

    if (cursor && "offset" in cursor && typeof cursor.offset === "number") {
      skip = cursor.offset;
    }
  }

  const events: EventRow[] = await prisma.event.findMany({
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

  const eventIds = events.map((e: EventRow) => e.id);

  const myGoingSet = new Set<string>();
  if (myId && eventIds.length > 0) {
    const mine: AttendanceRow[] = await prisma.eventAttendance.findMany({
      where: { userId: myId, eventId: { in: eventIds } },
      select: { eventId: true },
    });
    mine.forEach((r: AttendanceRow) => myGoingSet.add(r.eventId));
  }

  const items = events.map((e: EventRow) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    createdBy: e.createdBy,
    group: e.group,
    goingCount: e._count.attendees,
    goingByMe: myGoingSet.has(e.id),
    attendeesPreview: e.attendees.map((a: EventRow["attendees"][number]) => a.user),
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
      const currentOffset =
        cursor && "offset" in cursor && typeof cursor.offset === "number"
          ? cursor.offset
          : 0;
      nextCursor = encodeCursor({ offset: currentOffset + TAKE });
    }
  }

  return NextResponse.json({ items, nextCursor });
}