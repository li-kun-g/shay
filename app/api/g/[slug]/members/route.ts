export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TAKE = 30;

type CursorValue = { joinedAt: string; id: string } | null;

type MemberRow = {
  id: string;
  role: "PRESIDENT" | "ADMIN" | "MEMBER";
  position: string | null;
  showPosition: boolean;
  joinedAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
    major: string | null;
    college: string;
  };
};

function decodeCursor(cursor: string | null): CursorValue {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorValue;
  } catch {
    return null;
  }
}

function encodeCursor(obj: { joinedAt: string; id: string }) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const p = await Promise.resolve(ctx.params);
  const slug = (p?.slug ?? "").trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 400 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const session = await getServerSession(authOptions);
  const viewerId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      presidentId: true,
      status: true,
      membersListVisibility: true,
    },
  });

  if (!group || group.status !== ("APPROVED" as any)) {
    return NextResponse.json({ items: [], nextCursor: null }, { status: 404 });
  }

  if (group.membersListVisibility === ("MEMBERS_ONLY" as any)) {
    if (!viewerId) {
      return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
    }

    const isPresident = group.presidentId === viewerId;

    if (!isPresident) {
      const isMember = await prisma.groupMember.findFirst({
        where: { groupId: group.id, userId: viewerId },
        select: { id: true },
      });

      if (!isMember) {
        return NextResponse.json({ items: [], nextCursor: null }, { status: 403 });
      }
    }
  }

  let where: Record<string, unknown> = { groupId: group.id };

  if (q) {
    where = {
      groupId: group.id,
      OR: [
        { user: { username: { contains: q, mode: "insensitive" as const } } },
        { user: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    };
  }

  if (cursor?.joinedAt && cursor?.id) {
    const cDate = new Date(cursor.joinedAt);
    where = {
      AND: [
        where,
        {
          OR: [
            { joinedAt: { lt: cDate } },
            { joinedAt: cDate, id: { lt: cursor.id } },
          ],
        },
      ],
    };
  }

  const rows: MemberRow[] = await prisma.groupMember.findMany({
    where,
    orderBy: [{ joinedAt: "desc" }, { id: "desc" }],
    take: TAKE,
    select: {
      id: true,
      role: true,
      position: true,
      showPosition: true,
      joinedAt: true,
      user: {
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

  const items = rows.map((m: MemberRow) => ({
    id: m.id,
    role: m.role,
    position: m.showPosition ? m.position : null,
    joinedAt: m.joinedAt.toISOString(),
    user: m.user,
  }));

  let nextCursor: string | null = null;
  if (rows.length === TAKE) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({
      joinedAt: last.joinedAt.toISOString(),
      id: last.id,
    });
  }

  return NextResponse.json({ items, nextCursor });
}